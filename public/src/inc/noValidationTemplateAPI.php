<?php
// Set the header content
header('Content-Type: application/json');

// Use this to replace the $_SERVER[DOCUMENT_ROOT]
define('DOC_ROOT', rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/');

// Include the rest of the required constants and error constants
include_once DOC_ROOT . "includes/configurations/constants/errorConstants.php";

// Use this to track all mysql errors for debuggin
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
error_reporting(E_ALL);

// Include the class autoloader class
if (file_exists(DOC_ROOT . 'includes/configurations/auto-loader/classAutoLoader.php')) {
	include_once DOC_ROOT . 'includes/configurations/auto-loader/classAutoLoader.php';
} else {
	echo "No auto-loader: " . MAIN_ERROR;
}

// Set our main class that handles most operations in the app
if (class_exists('Info')) {
	$info = new Info();
	$info->setAdminEmail('farriers.clienttracker@gmail.com');
}
else {
	echo "No Info class: " . MAIN_ERROR;
}

// Redirect to https if server port is set to http
if((int)$_SERVER['SERVER_PORT'] === 80){
	$info->myRedirect('https://'.$_SERVER['HTTP_HOST']);
}

// Include the db connection
include_once DOC_ROOT . "includes/configurations/db-connection/dbConnection.php";

// Get the file that has the tables for the new user settings
$newUserTables = include_once DOC_ROOT . "includes/configurations/new-user-tables/newUserTables.php";

// Include the error messages
$defaultErrors = include_once DOC_ROOT . "includes/configurations/error-messages/errorMessages.php";

// Get the data from the server
$payload = file_get_contents('php://input');

// Decode the data
$data = json_decode($payload);

if(!empty($data->shouldValidate) && $data->shouldValidate !== false){
	include_once DOC_ROOT . "includes/configurations/authorizations/apiAuthorization.php";
}