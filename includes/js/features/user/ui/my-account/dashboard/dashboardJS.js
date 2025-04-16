import { addListener } from "../../../../../core/utils/dom/listeners.js";
import ManageUser from '../../../models/ManageUser.js';
import { setActiveTab } from "../components/tabs/tabManager.js";

const COMPONENT = 'Dashboard';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

const COMPONENT_ID = 'dashboard';
const manageUser = new ManageUser({ debug: false });
let cleanup = null;

const FORM_MSG = 'form-msg';
const TAB_CONTENT_CONTAINER = 'tab-content-container';

(async function init() {
	try {
		// Initialize tab event handlers for tabbed navigation
		initializeTabEventHandlers({ tabContainer: TAB_CONTENT_CONTAINER, manageUser, componentId: COMPONENT_ID });

		// Set up event listeners for the 5 tabbed pages
		initializeEventHandersForTabbedPages({tabContainer: TAB_CONTENT_CONTAINER, manageUser, componentId: COMPONENT_ID});
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		});
	}
})();

function initializeTabEventHandlers({tabContainer, manageUser, componentId}) {
	// Set up static event handlers
	const staticEventHandlers = {
		'click:manage-reminders-tab': async (evt) => {
			const { default: displayRemindersPage } = await import("../../../../../core/layout/user/pages/dashboard/tabs/reminders/displayRemindersPage.js");
			await displayRemindersPage({ evt, tabContainer, manageUser, componentId });
		},
		'click:manage-notifications-tab': async (evt) => {
			const { default: displayNotificationsPage } = await import("../../../../../core/layout/user/pages/dashboard/tabs/notifications/displayNotificationsPage.js");
			await displayNotificationsPage({ evt, tabContainer, manageUser, componentId });
		},
		'click:backup-data-tab': async (evt) => {
			const { default: displayBackupDataPage } = await import("../../../../../core/layout/user/pages/dashboard/tabs/backup-data/displayBackupDataPage.js");
			await displayBackupDataPage({ evt, tabContainer, manageUser, componentId });
		},
		'click:transfer-data-tab': async (evt) => {
			const { default: displayTransferDataPage } = await import("../../../../../core/layout/user/pages/dashboard/tabs/transfer-data/displayTransferDataPage.js");
			await displayTransferDataPage({ evt, tabContainer, manageUser, componentId });
		},
		'click:block-dates-tab': async (evt) => {
			const { default: displayBlockDatesPage } = await import("../../../../../core/layout/user/pages/dashboard/tabs/block-dates/displayBlockDatesPage.js");
			await displayBlockDatesPage({ evt, tabContainer, manageUser, componentId });
		},
	};

	// Handle the tab event listeners
	addListener({
		elementOrId: 'tab-container',
		eventType: 'click',
		handler: async (evt) => {
			// Clean up the previous tab if needed
			if (cleanup) {
				await cleanup();
				cleanup = null;
			}

			const keyPath = `${evt.type}:${evt.target.id}`;
			debugLog('keyPath: ', keyPath);
			if (staticEventHandlers[keyPath]) {
				// Set the active tab
				setActiveTab({ evt, msgElement: FORM_MSG }); // needs modification

				await staticEventHandlers[keyPath](evt);
			}
		},
		componentId: COMPONENT_ID,
	});
}

function initializeEventHandersForTabbedPages({tabContainer, manageUser, componentId}) {
	const tabbedPageEventHandlers = {
		'click:backup-data-submit-button': async (evt) => {
			const { default: backupDataToServer } = await import('./components/backup-data/backupDataToServer.js');
			debugLog('In backup-data-submit-button event: manaeUser: ', manageUser);
			await backupDataToServer({ tabContainer, manageUser, componentId });
		},
		'click:reminder-slider': async (evt) => {
			const checkbox = evt.target.previousElementSibling; // Get the checkbox before the slider
			evt.preventDefault(); // Prevent default span click
			checkbox.checked = !checkbox.checked; // Toggle checkbox manually

			const { default: handleReminderSlider } = await import('./components/reminders/handleReminderSlider.js');
			// Pass the checkbox as the target instead of the span
			await handleReminderSlider({ evt: { target: checkbox }, manageUser, componentId });
		},
		'click:notification-slider': async (evt) => {
			evt.preventDefault(); // Prevent default span click
			const checkbox = evt.target.previousElementSibling; // Get the checkbox before the slider
			checkbox.checked = !checkbox.checked; // Toggle checkbox manually

			const { default: handleNotificationSlider } = await import('./components/notifications/handleNotificationSlider.js');
			// Pass the checkbox as the target instead of the span
			await handleNotificationSlider({ evt: { target: checkbox }, manageUser, componentId });
		},
		'click:transfer-data-button': async (evt) => {
			evt.preventDefault();
			const { default: transferData } = await import('./components/transfer-data/transferData.js');
			await transferData({ manageUser });
		},
	};

	// Handle the dynamic event listeners
	addListener({
		elementOrId: tabContainer,
		eventType: ['click', 'change'],  // Add change event
		handler: async (evt) => {
			evt.preventDefault();
			debugLog('In dynamic event listener: evt.target:', evt.target);
			debugLog('In dynamic event listener: evt.target.id:', evt.target.id);

			const keyPath = `${evt.type}:${evt.target.id}`;
			if (tabbedPageEventHandlers[keyPath]) {
				await tabbedPageEventHandlers[keyPath](evt);
			}
		},
		componentId: COMPONENT_ID,
	});
}