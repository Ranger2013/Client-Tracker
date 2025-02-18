import setupPageTabListeners from "../../../utils/event-listeners/setupPageTabListeners.js";

// Set the DOM elements
const fm = document.getElementById('form-msg');
const tabContentContainer = document.getElementById('tab-content-container');

// Set the object to hold the tabs to listen for
const tabs = {
	reminders: {
		eleId: 'manage-reminders-tab',
		action: () => import("./reminders/displayRemindersPage.js"),
	},
	notifications: {
		eleId: 'manage-notifications-tab',
		action: () => import("./notifications/displayNotificationsPage.js"),
	},
	backupData: {
		eleId: 'backup-data-tab',
		action: () => import("./backup-data/displayBackupDataPage.js"),
	},
	transferData: {
		eleId: 'transfer-data-tab',
		action: () => import("./transfer-data/displayTransferDataPage.js"),
	},
	blockDates: {
		eleId: 'block-dates-tab',
		action: () => import("./block-dates/displayBlockDatesPage.js"),
	}
};

setupPageTabListeners(tabs, fm, tabContentContainer);