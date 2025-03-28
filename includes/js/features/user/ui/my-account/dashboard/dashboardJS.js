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
		// Set up static event handlers
		const staticEventHandlers = {
			'click:manage-reminders-tab': async (evt) => {
				const { default: displayRemindersPage } = await import("./pages/displayRemindersPage.js");
				await displayRemindersPage({ evt, messageContainer: FORM_MSG, tabContainer: TAB_CONTENT_CONTAINER, manageUser });
			},
			'click:manage-notifications-tab': async (evt) => {
				const { default: displayNotificationsPage } = await import("./pages/displayNotificationsPage.js");
				await displayNotificationsPage({ evt, messageContainer: FORM_MSG, tabContainer: TAB_CONTENT_CONTAINER, manageUser });
			},
			'click:backup-data-tab': async (evt) => {
				const { default: displayBackupDataPage } = await import("./pages/displayBackupDataPage.js");
				await displayBackupDataPage({ evt, tabContainer: TAB_CONTENT_CONTAINER, manageUser });
			},
			'click:transfer-data-tab': async (evt) => {
				const { default: displayTransferDataPage } = await import("./pages/displayTransferDataPage.js");
				await displayTransferDataPage({ evt, messageContainer: FORM_MSG, tabContainer: TAB_CONTENT_CONTAINER, manageUser });
			},
			'click:block-dates-tab': async (evt) => {
				const { default: displayBlockDatesPage } = await import("./pages/displayBlockDatesPage.js");
				await displayBlockDatesPage({ evt, messageContainer: FORM_MSG, tabContainer: TAB_CONTENT_CONTAINER, manageUser });
			},
		};

		// Set up dynamic event handlers
		const tabbedPageEventHandlers = {
			'click:backup-data-submit-button': async (evt) => {
				const { default: backupDataToServer } = await import('./components/backup-data/backupDataToServer.js');
				debugLog('In backup-data-submit-button event: manaeUser: ', manageUser);
				await backupDataToServer({ tabContainer: TAB_CONTENT_CONTAINER, manageUser, componentId: COMPONENT_ID });
			}
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

		// Handle the dynamic event listeners
		addListener({
			elementOrId: TAB_CONTENT_CONTAINER,
			eventType: 'click',
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
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		});
	}
})();