<?php

$IMAGE_PATH = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'photo-printer-webapp/';

if (!is_dir($IMAGE_PATH)) {
    mkdir($IMAGE_PATH);
}

$result = ['success' => false, 'message' => ''];

if (isset($_FILES['image'])) {
    $filename = $IMAGE_PATH . DIRECTORY_SEPARATOR . getFilename();
    if (move_uploaded_file($_FILES['image']['tmp_name'], $filename)) {
        $result['success'] = true;
        $result['message'] = getRandomMessage();
    } else {
        $result['success'] = false;
        $result['message'] = 'Could not move uploaded file';
    }
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