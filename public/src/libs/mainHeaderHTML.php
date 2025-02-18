<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
	<meta http-equiv="Pragma" content="no-cache">
	<meta http-equiv="Expires" content="0">

	<title><?php echo $title; ?></title>
	<meta name="Description"
		content="Farrier Client Tracker Application. Track your client's appointments, Add New Clients, Manage Clients, Track client horse's pathology issues with written notes and images. Track your mileage, Track your expenses, Track all your inventory, View total stats for income/expenses and mileage by year/month">

	<!-- Site Styles -->
	<link rel="stylesheet" href="/includes/css/w3-css.css" type="text/css">
	<link rel="icon" type="image/x-icon" href="/public/siteImages/favicon.png">

	<!-- javascript sources -->
	<?php if (!empty($js)) {
		echo $js;
	} ?>

</head>

<body>
	<header id="nav-header" class="w3-margin-top-header">
		<?php include_once DOC_ROOT . 'public/src/libs/mainNavigationHTML.php'; ?>
		<div class="w3-container w3-center w3-animate-top">
			<img src="/public/siteImages/main_logo.png" alt="Client Tracker">
		</div>
	</header>
	<main id="main">