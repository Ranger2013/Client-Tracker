<?php
// Set the content type header
header('Content-Type: application/json');

include_once rtrim($_SERVER['DOCUMENT_ROOT'],'/') . '/apiConfig.php';

// Get the data from the server
$payload = file_get_contents('php://input');

// Decode the data
$data = json_decode($payload);