import { getValidationToken } from '../../../../../core/auth/services/tokenUtils.js';
import { systemAPI } from '../../../../../core/network/api/apiEndpoints.js';
import { fetchData } from '../../../../../core/network/services/network.js';
import openModal, { closeModal } from '../../../../../core/services/modal/openModal.js';
import { getValidElement } from '../../../../../core/utils/dom/elements.js';
import { addListener } from '../../../../../core/utils/dom/listeners.js';

// Set up debug log
const COMPONENT = 'Show Install Prompt';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

// Event listener componnt
const COMPONENT_ID = 'show-install-prompt';

export default async function showInstallPrompt({ isIOS, manageUser, manageInstallApp }) {
	try {
		const apiEndpoint = isIOS ? systemAPI.installIOS : systemAPI.installApp;
		const modal = getValidElement('modal');
		const modalContent = getValidElement('modal-content');

		const response = await fetchData({
			api: apiEndpoint,
			token: getValidationToken(),
		});

		if (response.status === 'ok') {
			// Insert the contents into the modal and then open the modal
			modalContent.innerHTML = response.msg;
			openModal({
				content: response.msg,
				componentId: COMPONENT_ID,
			});

			getListenersForInstall({ componentId: COMPONENT_ID, modal, manageUser, manageInstallApp });
		}
	}
	catch (err) {
		throw err;
	}
};

function getListenersForInstall({ componentId, modal, manageUser, manageInstallApp }) {
	const staticEventHandlers = {
		'click:install-yes': async (evt) => {
			evt.preventDefault();
			await installApp({ evt, manageUser, manageInstallApp });
		},
		'click:install-no': async (evt) => {
			evt.preventDefault();
			await manageUser.updateLocalUserSettings({
				userData: {
					status: 'no',
					timestamp: Date.now(),
				},
				settingsProperty: 'installApp',
			});

			// Close the modal
			closeModal(componentId);
		},
		'click:install-never': async (evt) => {
			evt.preventDefault();
			await manageUser.updateLocalUserSettings({
				userData: {
					status: 'never',
					timestamp: Date.now(),
				},
				settingsProperty: 'installApp',
			});

			// Close the modal
			closeModal(componentId);
		},
	};

	addListener({
		elementOrId: modal,
		eventType: 'click',
		handler: async (evt) => {
			const keyPath = `${evt.type}:${evt.target.id}`;
			if (staticEventHandlers[keyPath]) {
				await staticEventHandlers[keyPath](evt);
			}
		},
		componentId,
	});
}

async function installApp({ evt, manageUser, manageInstallApp }) {
	const isInstalled = await manageInstallApp.promptForInstall();

	if(isInstalled){
		// Update the settings to indicate installation
		await manageUser.updateLocalUserSettings({
			userData: {
				status: 'installed',
				timestamp: Date.now(),
			},
			settingsProperty: 'installApp',
		});
	}
}