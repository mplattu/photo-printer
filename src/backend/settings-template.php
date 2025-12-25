<?php

// This file contains all local settings
// It should be located in the same directory with server.php

$SETTINGS = [
    // remove or comment following line after you have edited this
    '_settings_unset' => true,
    'ippPrinterURI' => 'http://127.0.0.1/ipp',
    'imagesHorisontallyOnPaper' => 6,
    'imagesVerticallyOnPaper' => 4,
    'paperMarginLeftAndTopMM' => 10,
    'paperImageSizeMM' => 46,
    'tempOriginalImages' => sys_get_temp_dir() . '/photo-printer/original',
    'tempQueuingImages' => sys_get_temp_dir() . '/photo-printer/queue',
    'tempFinalPDFs' => sys_get_temp_dir() . '/photo-printer/pdf',
    'tempDirectoryPermissons' => 0700,
];
