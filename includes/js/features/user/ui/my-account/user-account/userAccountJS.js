import { checkForDuplicate } from '../../../../../auth/services/duplicateCheck.js';
import { getValidElement } from '../../../../../core/utils/dom/elements.js';
import { createDebouncedHandler, getOptimalDelay } from '../../../../../core/utils/dom/eventUtils.js';
import { addListener, removeListeners } from '../../../../../core/utils/dom/listeners.js';
import ManageClient from '../../../../client/models/ManageClient.js';
import ManageUser from '../../../models/ManageUser.js';
import { setActiveTab } from '../components/tabs/tabManager.js';
import validateUsername from './tabs/account-settings/components/validateUsername.js';

// Setup debug mode
const COMPONENT = 'User Account Page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

let cleanup = null;

// Set component ID for event cleanup
const COMPONENT_ID = 'user-account-page';

const manageUser = new ManageUser({ debug: false });
const manageClient = new ManageClient({ debug: false });

(async function userAccountJS() {
	const tabContentContainer = getValidElement('tab-content-container');

	await initializeTabEventHandlers(tabContentContainer);

	// await initializeDynamicEventHandlers({tabContentContainer, manageUser});
})();

async function initializeTabEventHandlers(tabContentContainer) {
	try {
		const staticEventHandler = {
			'click:subscription-tab': async (evt) => { },
			'click:account-settings-tab': async (evt) => {
				const { default: buildAccountSettingsPage } = await import("../../../../../core/layout/user/pages/my-account/account-settings/buildAccountSettingsPage.js");
				return await buildAccountSettingsPage({ tabContentContainer, manageUser, componentId: COMPONENT_ID });
			},
			'click:client-stats-tab': async (evt) => {
				const { default: buildClientStatsPage } = await import("../../../../../core/layout/user/pages/my-account/client-stats/buildClientStatsPage.js");
				return await buildClientStatsPage({ tabContentContainer, manageUser, manageClient, componentId: COMPONENT_ID });
			},
			'click:monthly-projections-tab': async (evt) => {
				const { default: buildMonthlyProjectionsPage } = await import("../../../../../core/layout/user/pages/my-account/monthly-projections/buildMonthlyProjectionsPage.js");
				return await buildMonthlyProjectionsPage({ tabContentContainer, manageUser, componentId: COMPONENT_ID });
			},
			'click:invoices-tab': async (evt) => {
				const { default: buildInvoicesPage } = await import("../../../../../core/layout/user/pages/my-account/invoices/buildInvoicesPage.js");
				return await buildInvoicesPage({ tabContentContainer, manageUser, componentId: COMPONENT_ID });
			},
		};

		addListener({
			elementOrId: 'tab-container',
			eventType: 'click',
			handler: async (evt) => {
				try {
					if(cleanup){
						cleanup();
						cleanup = null;
					}

					setActiveTab({ evt, msgElement: 'form-msg' });

					const keyPath = `${evt.type}:${evt.target.id}`;

					if (staticEventHandler[keyPath]) {
						cleanup = await staticEventHandler[keyPath](evt);
					}
				}
				catch (err) {
					const { AppError } = await import("../../../../../core/errors/models/AppError.js");
					AppError.handleError(err, {
						errorCode: AppError.Types.RENDER_ERROR,
						message: AppError.BaseMessages.system.render,
						displayTarget: 'tab-content-container',
					});
				}
			},
			componentId: COMPONENT_ID,
		});
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			message: AppError.BaseMessages.system.initialization,
		});
	}
}