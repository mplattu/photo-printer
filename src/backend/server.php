<?php

$IMAGE_PATH = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'photo-printer-webapp/';

$ONPAPER_IMAGES_HORISONTALLY = 6;
$ONPAPER_IMAGES_VERTICALLY = 4;

require __DIR__ . DIRECTORY_SEPARATOR .'vendor/autoload.php';

use Fpdf\Fpdf;

if (!is_dir($IMAGE_PATH)) {
    mkdir($IMAGE_PATH);
}

$result = ['success' => false, 'message' => ''];

if (isset($_FILES['image'])) {
    $filename = $IMAGE_PATH . DIRECTORY_SEPARATOR . getFilename();

    $result['success'] = true;
    $result['message'] = getRandomMessage();

    try {
        processImage($_FILES['image']['tmp_name'], $filename);
    } catch (\Exception $e) {
        $result['success'] = false;
        $result['message'] = 'Could not process uploaded file: '.$e->getMessage();
    }
}

if ($result['success'] && paperPrinted($IMAGE_PATH, $ONPAPER_IMAGES_HORISONTALLY, $ONPAPER_IMAGES_VERTICALLY)) {
    $result['message'] = 'Check the printer!';
}

echo json_encode($result);

function getFilename(): string {
    $date = new DateTimeImmutable();
    return $date->format('Y-m-d_H-i-s_u') . '.png';
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

function processImage(string $sourceFilename, string $destinationFilename): void {
    if (!is_readable($sourceFilename)) {
        throw new \Exception("Given image file $sourceFilename does not exist");
    }

    $imageData = file_get_contents($sourceFilename);
    if (!$imageData) {
        throw new \Exception("Could not read image file $sourceFilename");
    }

    $image = imagecreatefromstring($imageData);
    if (!$image) {
        throw new \Exception("Could not read given imaga file $sourceFilename");
    }

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

    if (!imagepng($croppedImage,$destinationFilename)) {
        throw new \Exception("Cannot write processed image file");
    }

    if (!unlink($sourceFilename)) {
        throw new \Exception("Could not unlink source image file");
    }
}

function paperPrinted(string $imagePath, int $imagesHorisontally, int $imagesVertically): bool {
    $filenames = glob($imagePath . DIRECTORY_SEPARATOR . '*.png');
    $imagesPerSheet = $imagesHorisontally * $imagesVertically;

    if (count($filenames) < $imagesPerSheet) {
        return false;
    }

    $pdfString = createImagePDF($filenames, $imagesHorisontally, $imagesVertically);

    file_put_contents('/tmp/photo-printer.pdf', $pdfString);
    return true;
}

function createImagePDF(array $filenames, int $imagesHorisontally, int $imagesVertically): string {
    $MARGIN_LEFT_TOP_MM = 10;
    $IMAGE_SIZE_MM = 46;

    $pdf = new Fpdf('L', 'mm', 'A4');
    $pdf->AddPage();
 
    $currentImage = 0;

    for ($cellX=0; $cellX < $imagesHorisontally; $cellX++) {
        for ($cellY=0; $cellY < $imagesVertically; $cellY++) {
            $posX = $MARGIN_LEFT_TOP_MM + $cellX * $IMAGE_SIZE_MM;
            $posY = $MARGIN_LEFT_TOP_MM + $cellY * $IMAGE_SIZE_MM;
            $pdf->Image($filenames[$currentImage], $posX, $posY, $IMAGE_SIZE_MM, 0);
            $currentImage++;
        }
    }

 
    $pdfString = $pdf->Output('S');

    return $pdfString;
}