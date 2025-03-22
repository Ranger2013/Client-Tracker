import { addListener } from "../../../../../core/utils/dom/listeners.js";
import ManageUser from '../../../models/ManageUser.js';
import { setActiveTab } from "../components/tabs/tabManager.js";

const COMPONENT_ID = 'dashboard';

const manageUser = new ManageUser();

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
		action: () => import("./pages/displayBackupDataPage.js"),
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

/**
 * Initialize the page tab listeners.
 * @param {Object} params - The parameters for the function.
 * @param {Object} params.tabs - The tabs to listen for.
 * @param {HTMLElement} params.fm - The form message element.
 * @param {HTMLElement} params.tabContentContainer - The tab content container element.
 * @returns {Promise<void>}
 */
async function setupPageTabListeners({tabs, fm, tabContentContainer}) {
	let cleanup = null;
	try{
		// Loop through the tabs
		for(const [tabName, { eleId, action}] of Object.entries(tabs)){
			addListener({
				elementOrId: eleId,
				eventType: 'click',
				handler: async (evt) => {
					try{
						// Clean up the previous tab if needed
						if(cleanup) {
							await cleanup();
							cleanup = null;
						}

						// Update active tab state
						setActiveTab({evt, tabs, msgElement: fm});

						// Load and initialize the new tab content
						const { default: tabAction } = await action();
						cleanup = await tabAction({evt, messageContainer: fm, tabContainer: tabContentContainer, manageUser});
					}
					catch(err){
						const { AppError } = await import("../../../../../core/errors/models/AppError.min.js");
						AppError.handleError(err, {
							errorCode: AppError.Types.RENDER_ERROR,
							userMessage: AppError.BaseMessages.system.render,
						});
					}
				},
				componentId: COMPONENT_ID,
			})
		}
	}
	catch(err){
		const { AppError } = await import("../../../../../core/errors/models/AppError.min.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		});
	}
}

// Initialize the page tab listeners
setupPageTabListeners({tabs, fm, tabContentContainer});