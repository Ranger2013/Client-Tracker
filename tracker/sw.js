import { cacheFirst, dynamicCacheName, networkFirst, staticCacheName } from "../includes/js/utils/network/swFunctions.js";

// Our app shell assets to cache
const assets = [
	// '/includes/css/w3-css.css',
	// '/includes/js/tracker.js',
	// '/includes/js/classes/IndexedDBOperations.js',
	// '/includes/js/classes/ManageClient.js',
	// '/includes/js/classes/ManageExpenses.js',
	// '/includes/js/classes/ManageFuelCharges.js',
	// '/includes/js/classes/ManagePersonalNotes.js',
	// '/includes/js/classes/ManageTrimming.js',
	// '/includes/js/classes/ManageUser.js',
	// '/includes/js/classes/ManageUserMileage.js',
	// '/includes/js/classes/TokenValidation.js',
	// '/includes/js/pages/client-menu/client-horses/add/addHorseJS.js',
	// '/includes/js/pages/client-menu/client-horses/edit/editHorseJS.js',
	// '/includes/js/pages/client-menu/trimmings/add/addTrimmingJS.js',
	// '/includes/js/pages/client-menu/trimmings/add/handleTrimmingFormSubmission.js',
	// '/includes/js/pages/client-menu/trimmings/add/helpers/addOptionToRemainingHorseListSelectElements.js',
	// '/includes/js/pages/client-menu/trimmings/add/helpers/adjustNextTrimmingDate.js',
	// '/includes/js/pages/client-menu/trimmings/add/helpers/autoFillHorseList.js',
	// '/includes/js/pages/client-menu/trimmings/add/helpers/calculateTotalCost.js',
	// '/includes/js/pages/client-menu/trimmings/add/helpers/changeServiceCost.js',
	// '/includes/js/pages/client-menu/trimmings/add/helpers/removeLastChildAndGetOption.js',
	// '/includes/js/pages/client-menu/trimmings/add/helpers/showAccessoriesSelectElement.js',
	// '/includes/js/pages/client-menu/trimmings/add/helpers/showChangeServiceCostInput.js',
	// '/includes/js/pages/client-menu/trimmings/add/helpers/showHorseListSelectElements.js',
	// '/includes/js/pages/client-menu/trimmings/add/helpers/showListOfHorses.js',
	// '/includes/js/pages/client-menu/trimmings/add/helpers/updateHorseListSelectElements.js',
	// '/includes/js/pages/client-menu/trimmings/add/helpers/updateTrimCost.js',
	// '/includes/js/pages/clients/add-edit-client/addEditClientJS.js',
	// '/includes/js/pages/clients/add-edit-client/addEditFormSubmission.js',
	// '/includes/js/pages/clients/delete-duplicate-client/deleteDuplicateClientJS.js',
	// '/includes/js/pages/clients/duplicate-client/duplicateClientJS.js',
	// '/includes/js/pages/clients/duplicate-client/helpers/buildDuplicateClientElements.js',
	// '/includes/js/pages/clients/duplicate-client/helpers/handleDuplicateClientFormSubmission.js',
	// '/includes/js/pages/clients/schedule-list/clientListJS.js',
	// '/includes/js/pages/clients/schedule-list/helpers/dateSearch.js',
	// '/includes/js/pages/clients/schedule-list/helpers/dropDownClientMenu.js',
	// '/includes/js/pages/clients/schedule-list/helpers/menuHandlers.js',
	// '/includes/js/pages/clients/schedule-list/helpers/searchHandlers.js',
	// '/includes/js/pages/expenses/add/addExpensesJS.js',
	// '/includes/js/pages/expenses/add/helpers/addExpensesFormSubmission.js',
	// '/includes/js/pages/home/trackerHomeJS.js',
	// '/includes/js/pages/mileage/add/addMileageJS.js',
	// '/includes/js/pages/mileage/add/helpers/buildClientListSelect.js',
	// '/includes/js/pages/mileage/add/helpers/buildDestinationInput.js',
	// '/includes/js/pages/mileage/add/helpers/handleMileageFormSubmission.js',
	// '/includes/js/pages/my-account/dashboard/backup-data/displayBackupDataPage.js',
	// '/includes/js/pages/my-account/dashboard/backup-data/helpers/backupDataToServer.js',
	// '/includes/js/pages/my-account/dashboard/backup-data/helpers/buildBackupPageElements.js',
	// '/includes/js/pages/my-account/dashboard/backup-data/helpers/handleClearingStore.js',
	// '/includes/js/pages/my-account/dashboard/backup-data/helpers/handleDisplayMsg.js',
	// '/includes/js/pages/my-account/dashboard/backup-data/helpers/handleIndicatorLights.js',
	// '/includes/js/pages/my-account/dashboard/backup-data/helpers/setIndicatorLights.js',
	// '/includes/js/pages/my-account/dashboard/backup-data/helpers/setupObjectStoreStructure.js',
	// '/includes/js/pages/my-account/dashboard/block-dates/displayBlockDatesPage.js',
	// '/includes/js/pages/my-account/dashboard/block-dates/helpers/handleBlockDatesFormSubmission.js',
	// '/includes/js/pages/my-account/dashboard/block-dates/helpers/handleClearBlockDatesFormSubmission.js',
	// '/includes/js/pages/my-account/dashboard/block-dates/helpers/setClearDatesButtonListener.js',
	// '/includes/js/pages/my-account/dashboard/block-dates/helpers/setSubmitButtonListener.js',
	// '/includes/js/pages/my-account/dashboard/helpers/listenForSlider.js',
	// '/includes/js/pages/my-account/dashboard/notifications/displayNotificationsPage.js',
	// '/includes/js/pages/my-account/dashboard/notifications/helpers/buildNotificationsPage.js',
	// '/includes/js/pages/my-account/dashboard/reminders/displayRemindersPage.js',
	// '/includes/js/pages/my-account/dashboard/reminders/helpers/buildRemindersPage.js',
	// '/includes/js/pages/my-account/dashboard/dashboardJS.js',
	// '/includes/js/pages/my-account/user-account/account-settings/displayAccountSettingsPage.js',
	// '/includes/js/pages/my-account/user-account/client-stats/displayClientStatsPage.js',
	// '/includes/js/pages/my-account/user-account/monthly-projections/displayMonthlyProjectionSelectElement.js',
	// '/includes/js/pages/my-account/user-account/subscription/displaySubscriptionPage.js',
	// '/includes/js/pages/my-account/user-account/unpaid-invoices/displayUnpaidInvoices.js',
	// '/includes/js/pages/my-account/user-account/unpaid-invoices/showUnpaidClientInvoiceModal.js',
	// '/includes/js/pages/my-account/user-account/myAccountJS.js',
	// '/includes/js/pages/personal-notes/add/addPersonalNotesJS.js',
	// '/includes/js/pages/personal-notes/edit/helpers/handlePersonalNotesFormSubmission.js',
	// '/includes/js/pages/personal-notes/edit/editPersonalNotesJS.js',
	// '/includes/js/pages/settings/color-options/colorOptionsJS.js',
	// '/includes/js/pages/settings/date-time/helpers/populateDateTimeForm.js',
	// '/includes/js/pages/settings/date-time/dateTimeJS.js',
	// '/includes/js/pages/settings/farrier-prices/helpers/buildInputBlocks.js',
	// '/includes/js/pages/settings/farrier-prices/helpers/displayMultipleInputs.js',
	// '/includes/js/pages/settings/farrier-prices/helpers/makeInputsGreen.js',
	// '/includes/js/pages/settings/farrier-prices/helpers/populateFarrierPricesForm.js',
	// '/includes/js/pages/settings/farrier-prices/helpers/seperateFarrierPricesFromAccessories.js',
	// '/includes/js/pages/settings/farrier-prices/farrierPricesJS.js',
	// '/includes/js/pages/settings/fuel-charges/helpers/buildByMileSection.js',
	// '/includes/js/pages/settings/fuel-charges/helpers/buildFuelRangeSection.js',
	// '/includes/js/pages/settings/fuel-charges/helpers/buildMileageRangeInputs.js',
	// '/includes/js/pages/settings/fuel-charges/helpers/handleRadioButtonSelect.js',
	// '/includes/js/pages/settings/fuel-charges/helpers/listenForFuelRangeInput.js',
	// '/includes/js/pages/settings/fuel-charges/helpers/populateMileageChargesValues.js',
	// '/includes/js/pages/settings/fuel-charges/handleByRangeFormSubmission.js',
	// '/includes/js/pages/settings/fuel-charges/handlePerMileFormSubmission.js',
	// '/includes/js/pages/settings/fuel-charges/mileageChargesJS.js',
	// '/includes/js/pages/settings/schedule-options/helpers/listenersToClearErrors.js',
	// '/includes/js/pages/settings/schedule-options/helpers/populateScheduleOptionsForm.js',
	// '/includes/js/pages/settings/schedule-options/scheduleOptionsJS.js',
	// '/includes/js/utils/appointment-block/helpers/appointmentBlockData.js',
	// '/includes/js/utils/appointment-block/helpers/buildAppointmentBlock.js',
	// '/includes/js/utils/appointment-block/helpers/buildNoAppointmentsBlock.js',
	// '/includes/js/utils/appointment-block/helpers/buildProjectedAppointmentBlock.js',
	// '/includes/js/utils/appointment-block/helpers/calculateTime.js',
	// '/includes/js/utils/appointment-block/helpers/getBlockOfTime.js',
	// '/includes/js/utils/appointment-block/helpers/getCurrentAppointments.js',
	// '/includes/js/utils/appointment-block/helpers/getProjectedAppointments.js',
	// '/includes/js/utils/appointment-block/helpers/predictNextSessionNumberHorses.js',
	// '/includes/js/utils/appointment-block/checkAppointment.js',
	// '/includes/js/utils/backup-notice/backupNotice.js',
	// '/includes/js/utils/calendar/helpers/addListenersToDateCells.js',
	// '/includes/js/utils/calendar/helpers/addNavigationListeners.js',
	// '/includes/js/utils/calendar/helpers/buildButtonContainer.js',
	// '/includes/js/utils/calendar/helpers/generateCalendar.js',
	// '/includes/js/utils/calendar/helpers/handleSubmitButtonClicks.js',
	// '/includes/js/utils/calendar/helpers/setupCalendarElements.js',
	// '/includes/js/utils/calendar/helpers/updateCalendar.js',
	// '/includes/js/utils/calendar/helpers/updateMonthName.js',
	// '/includes/js/utils/calendar/buildCalendar.js',
	// '/includes/js/utils/configurations/trimCycleConfigurations.js',
	// '/includes/js/utils/date/dateUtils.js',
	// '/includes/js/utils/dom/buildGenericSelectOptions.js',
	// '/includes/js/utils/dom/displayFormValidationErrors.js',
	// '/includes/js/utils/dom/domConstants.js',
	// '/includes/js/utils/dom/domUtils.js',
	// '/includes/js/utils/dom/getAllFormIDElements.js',
	// '/includes/js/utils/dom/renderUtils.js',
	// '/includes/js/utils/error-messages/backupErrorPage.js',
	// '/includes/js/utils/error-messages/errorLogs.js',
	// '/includes/js/utils/error-messages/errorMessages.js',
	// '/includes/js/utils/error-messages/handleError.js',
	// '/includes/js/utils/event-listeners/eventUtils.js',
	// '/includes/js/utils/event-listeners/listeners.js',
	// '/includes/js/utils/event-listeners/setupPageTabListeners.js',
	// '/includes/js/utils/modal/openModal.js',
	// '/includes/js/utils/navigation/closeNavigationMenu.js',
	// '/includes/js/utils/navigation/dropDownClientMenu.js',
	// '/includes/js/utils/navigation/dropDownMenu.js',
	// '/includes/js/utils/navigation/selectClientMenuPage.js',
	// '/includes/js/utils/navigation/selectPage.js',
	// '/includes/js/utils/navigation/sideBarNavigation.js',
	// '/includes/js/utils/navigation/trackerAppMainNavigation.js',
	// '/includes/js/utils/network/apiEndpoints.js',
	// '/includes/js/utils/network/network.js',
	// '/includes/js/utils/network/swFunctions.js',
	// '/includes/js/utils/page-builders/config/renderConfigs.js',
	// '/includes/js/utils/page-builders/helpers/buildErrorDiv.js',
	// '/includes/js/utils/page-builders/helpers/buildPageContainer.js',
	// '/includes/js/utils/page-builders/helpers/buildSearchBlock.js',
	// '/includes/js/utils/page-builders/helpers/buildSubmitButtonSection.js',
	// '/includes/js/utils/page-builders/helpers/buildSubmitDeleteButtonSection.js',
	// '/includes/js/utils/page-builders/helpers/buildTwoColumnAddressSection.js',
	// '/includes/js/utils/page-builders/helpers/buildTwoColumnInputSection.js',
	// '/includes/js/utils/page-builders/helpers/buildTwoColumnRadioButtonSection.js',
	// '/includes/js/utils/page-builders/helpers/buildTwoColumnSelectElementSection.js',
	// '/includes/js/utils/page-builders/helpers/buildTwoColumnTextareaSection.js',
	// '/includes/js/utils/page-builders/pages/client-menu/client-horses/add-horse/buildAddHorsePage.js',
	// '/includes/js/utils/page-builders/pages/client-menu/client-horses/add-horse/helpers/formBuilder.js',
	// '/includes/js/utils/page-builders/pages/client-menu/client-horses/add-horse/helpers/pageRenderer.js',
	// '/includes/js/utils/page-builders/pages/client-menu/client-horses/edit-horse/buildEditHorsePage.js',
	// '/includes/js/utils/page-builders/pages/client-menu/client-horses/helpers/buildNoClientAvailablePage.js',
	// '/includes/js/utils/page-builders/pages/client-menu/trimming/add/helpers/buildFuelChargeCheckboxSection.js',
	// '/includes/js/utils/page-builders/pages/client-menu/trimming/add/helpers/buildInvoicePaidCheckboxSection.js',
	// '/includes/js/utils/page-builders/pages/client-menu/trimming/add/helpers/buildNoHorsesPage.js',
	// '/includes/js/utils/page-builders/pages/client-menu/trimming/add/helpers/buildReceiptSection.js',
	// '/includes/js/utils/page-builders/pages/client-menu/trimming/add/helpers/buildSessionNotesSection.js',
	// '/includes/js/utils/page-builders/pages/client-menu/trimming/add/helpers/calculatePayment.js',
	// '/includes/js/utils/page-builders/pages/client-menu/trimming/add/helpers/getMileageCharges.js',
	// '/includes/js/utils/page-builders/pages/client-menu/trimming/add/buildAddTrimmingPage.js',
	// '/includes/js/utils/page-builders/pages/client-menu/trimming/view/helpers/buildTrimmingHeader.js',
	// '/includes/js/utils/page-builders/pages/client-menu/trimming/view/helpers/buildTrimmingList.js',
	// '/includes/js/utils/page-builders/pages/client-menu/trimming/view/buildViewTrimmingPage.js',
	// '/includes/js/utils/page-builders/pages/clients/add-duplicate/buildDuplicateClientPage.js',
	// '/includes/js/utils/page-builders/pages/clients/add-edit-client/helpers/getClientInformation.js',
	// '/includes/js/utils/page-builders/pages/clients/add-edit-client/buildAddEditClientPage.js',
	// '/includes/js/utils/page-builders/pages/clients/delete-duplicate/helpers/buildDuplicateClientList.js',
	// '/includes/js/utils/page-builders/pages/clients/delete-duplicate/helpers/getUserAndClientInfo.js',
	// '/includes/js/utils/page-builders/pages/clients/delete-duplicate/buildDeleteDuplicateClientPage.js',
	// '/includes/js/utils/page-builders/pages/clients/schedule-list/helpers/buildClientList.js',
	// '/includes/js/utils/page-builders/pages/clients/schedule-list/helpers/buildClientListPersonalNotes.js',
	// '/includes/js/utils/page-builders/pages/clients/schedule-list/helpers/buildPersonalNotesSection.js',
	// '/includes/js/utils/page-builders/pages/clients/schedule-list/helpers/buildScheduleTitleBlock.js',
	// '/includes/js/utils/page-builders/pages/clients/schedule-list/helpers/config.js',
	// '/includes/js/utils/page-builders/pages/clients/schedule-list/helpers/pageBuilder.js',
	// '/includes/js/utils/page-builders/pages/clients/schedule-list/buildScheduleListPage.js',
	// '/includes/js/utils/page-builders/pages/expenses/add/buildAddExpensesPage.js',
	// '/includes/js/utils/page-builders/pages/mileage/buildAddMileagePage.js',
	// '/includes/js/utils/page-builders/pages/personal-notes/add-notes/buildAddPersonalNotesPage.js',
	// '/includes/js/utils/page-builders/pages/personal-notes/edit-notes/helpers/buildPersonalNotesListBlock.js',
	// '/includes/js/utils/page-builders/pages/personal-notes/edit-notes/buildEditPersonalNotesPage.js',
	// '/includes/js/utils/string/stringUtils.js',
	// '/includes/js/utils/validation/helpers/validateCity.js',
	// '/includes/js/utils/validation/helpers/validateClientName.js',
	// '/includes/js/utils/validation/helpers/validateDistance.js',
	// '/includes/js/utils/validation/helpers/validateEmail.js',
	// '/includes/js/utils/validation/helpers/validatePhone.js',
	// '/includes/js/utils/validation/helpers/validateState.js',
	// '/includes/js/utils/validation/helpers/validateStreet.js',
	// '/includes/js/utils/validation/helpers/validateTrimCycle.js',
	// '/includes/js/utils/validation/helpers/validateZip.js',
	// '/includes/js/utils/validation/checkClientFormValidity.js',
	// '/includes/js/utils/validation/handleFormValidation.js',
	// '/includes/js/utils/validation/userAuthorization.js',
	// '/includes/js/utils/validation/validateAddExpensesForm.js',
	// '/includes/js/utils/validation/validateAddPersonalNotesForm.js',
	// '/includes/js/utils/validation/validateTrimmingForm.js',
	// '/includes/js/utils/validation/validationUtils.js',
	// '/tracker/manifest.webmanifest',
	// '/tracker/public/src/libs/trackerFallBackPage.php',
	// '/public/siteImages/icon-192x192.png',
	// '/public/siteImages/caret-down-white.svg',
	// '/public/siteImages/caret-up-white.svg',
	// '/public/siteImages/indicator_blue_light.png',
	// '/public/siteImages/indicator_green_light.webp',
	// '/public/siteImages/indicator_red_light.png',
	// '/public/siteImages/indicator_yellow_light.webp',
	// '/public/siteImages/main_logo.png',
	// '/public/siteImages/nav-bars.svg',
	// '/public/siteImages/nav_logo.png',
	// '/public/siteImages/infoIcon.svg',
];

self.addEventListener('install', async (evt) => {
	try {
		// Have the install wait opening the cache
		const cache = await caches.open(staticCacheName);

		// Cache all the assets
		await cache.addAll(assets);
		self.skipWaiting();
	}
	catch (err) {
		console.warn('SW Install Error:', err);
		// Send an error log that the sw did not install
		const params = {
			'event': 'Service Worker Install',
			'error': err,
		};
	}
});

self.addEventListener('activate', async (evt) => {
	try {
		// Get the keys for the cache
		const keys = await caches.keys();

		// wait to resolve all the keys
		await Promise.all(
			keys.filter(key => key !== staticCacheName && key !== dynamicCacheName).map(key => caches.delete(key))
		);
	}
	catch (err) {
		console.warn('SW Activate Error:', err);
		// Send an error log that the sw did not install
	}
});

self.addEventListener('fetch', async (evt) => {
	try {
		// Get the request url
		const requestURL = evt.request.url;

		// Do not intercept the following pages
		const noCatch = [
			'/login/',
			'/logout/',
			'/tracker/online.php',
			'123checkout.io',
		];

		// Loop through the pages we do not want intercepted
		if (noCatch.some(page => requestURL.includes(page))) {
			try {
				evt.respondWith(
					fetch(evt.request).then(response => {
						return response;
					}).catch(err => {
						console.warn('Native fetch request error in sw: ', err);
						throw err;  // Re-throw the error to be caught by the outer catch block
					})
				);
				return; // Return here to prevent the second respondWith call for the other pages.
			} catch (err) {
				console.warn('Native fetch request error in sw:', err);
			}
		}

		// Get the SPA pages from the assets. If the request url includes any of the SPA pages, use the cache first strategy.
		if (assets.some(route => requestURL.includes(route))) {
			evt.respondWith(cacheFirst(evt));
		}
		else {
			evt.respondWith(networkFirst(evt));
		}
	}
	catch (err) {
		console.warn('SERVICE WORKER FETCH EVENT ERROR: ', err);
	}
});