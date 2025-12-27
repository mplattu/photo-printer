<?php

require __DIR__ . DIRECTORY_SEPARATOR .'vendor/autoload.php';
use Fpdf\Fpdf;

require __DIR__ . DIRECTORY_SEPARATOR . 'settings.php';
try {
    $settings = new Settings($SETTINGS);
} catch (\Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Check your settings.php']);
}


ensureDirectoriesExist($settings);

$result = ['success' => false, 'message' => ''];

if (isset($_FILES['image'])) {
    $result['success'] = true;
    $result['message'] = getRandomMessage();

    try {
        processImage($_FILES['image']['tmp_name'], $settings);
    } catch (\Exception $e) {
        $result['success'] = false;
        $result['message'] = 'Could not process uploaded file: '.$e->getMessage();
    }
}

if ($result['success'] && queueNeedsPrinting($settings) !== null) {
    $result['message'] = 'Check the printer!';
}

echo json_encode($result);

if (queueNeedsPrinting($settings) !== null) {
    ignore_user_abort(true);
    if (function_exists('fastcgi_finish_request')) {
        if (!fastcgi_finish_request()) {
            error_log('Could not execute fastcgi_finish_request()', 4);
        }
    }

    paperPrinted($settings);
}

exit(0);

function getFilename(string $path, string $ext): string {
    $date = new DateTimeImmutable();
    return $path . DIRECTORY_SEPARATOR . $date->format('Y-m-d_H-i-s_u') . ".$ext";
}

function getRandomMessage(): string {
    $messages = [
        'All is well!',
        'Thanks for the fish!',
        'You look awesome!',
        'Hello world!'
    ];

    $randomIndex = random_int(0, count($messages)-1);

    return $messages[$randomIndex];
}

function ensureDirectoryExists(string $directory, int $permissions) {
    if (!is_dir($directory)) {
        mkdir($directory, $permissions, true);
    }
}

function ensureDirectoriesExist(object $settings): void {
    ensureDirectoryExists($settings->get('tempOriginalImages'), $settings->get('tempDirectoryPermissions'));
    ensureDirectoryExists($settings->get('tempQueuingImages'), $settings->get('tempDirectoryPermissions'));
    ensureDirectoryExists($settings->get('tempFinalPDFs'), $settings->get('tempDirectoryPermissions'));
}

function unlinkAll(array $filenames): bool {
    $removedFilesCount = 0;

    foreach ($filenames as $filename) {
        if (unlink($filename)) {
            $removedFilesCount++;
        }
    }

    return $removedFilesCount == count($filenames);
}

function processImage(string $sourceFilename, object $settings): void {
    if (!is_readable($sourceFilename)) {
        throw new \Exception("Given image file $sourceFilename does not exist");
    }

    $imageData = file_get_contents($sourceFilename);
    if (!$imageData) {
        throw new \Exception("Could not read image file $sourceFilename");
    }

    $originalImageFilename = getFilename($settings->get('tempOriginalImages'), 'png');
    if (!file_put_contents($originalImageFilename, $imageData)) {
        throw new \Exception("Could not write original copy to $originalImageFilename");
    }

    $image = imagecreatefromstring($imageData);
    if (!$image) {
        throw new \Exception("Source image file does not contain an image: $sourceFilename");
    }

    cropImage($image);
    scaleImage($image, $settings);

    $queueFilename = getFilename($settings->get('tempQueuingImages'), 'png');
    if (!imagepng($image,$queueFilename)) {
        throw new \Exception("Cannot write image file to queue: $queueFilename");
    }

    if (!unlink($sourceFilename)) {
        throw new \Exception("Could not unlink source image file: $sourceFilename");
    }
}

function cropImage(&$image) {
    $imageWidth = imagesx($image);
    $imageHeight = imagesy($image);

    $newImageDimension = min([$imageWidth, $imageHeight]);

    $cropParameters = [
        'x' => (int) round(($imageWidth - $newImageDimension) / 2),
        'y' => (int) round(($imageHeight - $newImageDimension) / 2),
        'width' => $newImageDimension,
        'height' => $newImageDimension,
    ];

    $croppedImage = imagecrop($image, $cropParameters);

    $image = $croppedImage;
}

function scaleImage(&$image, object $settings) {
    $imageWidth = imagesx($image);

    if ($imageWidth > $settings->get('imageMaxDimensionPX')) {
        $image = imagescale($image, $settings->get('imageMaxDimensionsPX'), -1);
    }

    $imageHeight = imagesy($image);
    if ($imageHeight > $settings->get('imageMaxDimensionPX')) {
        $scale = $settings->get('imageMaxDimensionPX') / $imageHeight;
        $imageWidth = imagesx($image);
        $image = imagescale($image, $imageWidth * $scale, $settings->get('imageMaxDimensionPX'));
    }
}

function queueNeedsPrinting(object $settings): array|null {
    $queuingFilenames = glob($settings->get('tempQueuingImages') . DIRECTORY_SEPARATOR . '*.png');
    $imagesPerSheet = $settings->get('imagesHorisontallyOnPaper') * $settings->get('imagesVerticallyOnPaper');

    if (count($queuingFilenames) >= $imagesPerSheet) {
        return $queuingFilenames;
    }

    return null;
}

function paperPrinted(object $settings): bool {
    $queuingFilenames = queueNeedsPrinting($settings);
    if ($queuingFilenames == null) {
        return false;
    }

    $jobId = uuidv4();
    $jobPath = $settings->get('tempQueuingImages') . DIRECTORY_SEPARATOR . $jobId;
    $jobFilenames = moveImagesToJobDirectory($queuingFilenames, $jobPath, $settings);

    $pdfString = createImagePDF($jobFilenames, $settings);

    file_put_contents(getFilename($settings->get('tempFinalPDFs'), 'pdf'), $pdfString);
    printToIPPQueue($pdfString, $settings);

    if (!unlinkAll($jobFilenames)) {
        throw new \Exception("Failed to remove job image files after PDF has been printed");
    }

    if (!rmdir($jobPath)) {
        throw new \Exception("Could not remove job image directory after PDF has been printed");
    }

    return true;
}

function moveImagesToJobDirectory(array $imageFilenames, string $jobPath, object $settings): array {
    ensureDirectoryExists($jobPath, $settings->get('tempDirectoryPermissions'));

    $jobFilenames = [];
    foreach ($imageFilenames as $imageFilename) {
        $jobFilename = $jobPath . DIRECTORY_SEPARATOR . basename($imageFilename);

        if (!rename($imageFilename, $jobFilename)) {
            throw new \Exception("Could not rename image file $imageFilename to $jobFilename");
        }

        $jobFilenames[] = $jobFilename;
    }

    return $jobFilenames;
}

function createImagePDF(array $filenames, object $settings): string {
    $pdf = new Fpdf('L', 'mm', 'A4');
    $pdf->AddPage();
 
    $currentImage = 0;

    for ($cellX=0; $cellX < $settings->get('imagesHorisontallyOnPaper'); $cellX++) {
        for ($cellY=0; $cellY < $settings->get('imagesVerticallyOnPaper'); $cellY++) {
            $posX = $settings->get('paperMarginLeftAndTopMM') + $cellX * $settings->get('paperImageSizeMM');
            $posY = $settings->get('paperMarginLeftAndTopMM') + $cellY * $settings->get('paperImageSizeMM');
            $pdf->Image($filenames[$currentImage], $posX, $posY, $settings->get('paperImageSizeMM'), 0);
            $currentImage++;
        }
    }
 
    $pdfString = $pdf->Output('S');

    return $pdfString;
}

function printToIPPQueue(string $pdfDocument, object $settings): void {
    $printer = new \obray\ipp\Printer($settings->get('ippPrinterURI'));
    $printer->printJob($pdfDocument, 1, ['document-format' => 'application/pdf']);
}

function uuidv4() {
    $data = random_bytes(16);

    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10
        
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

class Settings {
    private $settingsData;

    public function __construct($settingsDataParam) {
        if (array_key_exists('_settings_unset', $settingsDataParam) and $settingsDataParam['_settings_unset']) {
            throw new \Exception("Got uninitialised settings variable");
        }

        $this->settingsData = $settingsDataParam;
   }

   public function get(string $key): mixed{
        if ($this->settingsData === null) {
            throw new \Exception("Tried to get settings, but there is no settings data");
        }

        if (array_key_exists($key, $this->settingsData)) {
            return $this->settingsData[$key];
        }

        throw new \Exception("Tried to get unknown setting: '$key'");
   }
}