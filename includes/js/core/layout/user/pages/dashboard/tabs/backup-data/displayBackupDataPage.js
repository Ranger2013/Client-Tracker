import { buildEle, getValidElement } from '../../../../../../utils/dom/elements.js';
import { addListener, removeListeners } from '../../../../../../utils/dom/listeners.js';
import { clearMsg } from '../../../../../../utils/dom/messages.js';
import buildBackupDataPageComponents from '../../../../../../../features/user/ui/my-account/dashboard/components/backup-data/buildPageComponents.js';

const COMPONENT = 'Display Backup Data Page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

/**
 * Displays the backup data page.
 * @param {Object} params - The parameters for the function.
 * @param {Event} params.evt - The event object.
 * @param {HTMLElement} params.tabContainer - The container for the tab content.
 * @param {Object} params.manageUser - The manageUser instance.
 * @returns {Promise<void>}
 */
export default async function displayBackupDataPage({ evt, tabContainer, manageUser, componentId }) {
	try {
		// 1. Clear any messages that may have been displayed
		clearMsg({ container: 'form-msg' });
		clearMsg({ container: 'page-msg' });

		tabContainer = getValidElement(tabContainer);

		const pageComponents = await buildBackupDataPageComponents({ manageUser });
		debugLog('In displayBackupDataPage: pageComponents: ', pageComponents);

		renderPage({ tabContainer, pageComponents });

		showBackupDataButton({pageComponents});

		return () => removeListeners(componentId);
	}
	catch (err) {
		const { AppError } = await import("../../../../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
		}, true);
	}
}

function renderPage({ tabContainer, pageComponents }) {
	const { container, storeRowsContainer, successContainer, title, titleContainer, buttonContainer, button } = pageComponents;

	titleContainer.appendChild(title);
	buttonContainer.appendChild(button);
	container.append(titleContainer, successContainer, buttonContainer, storeRowsContainer);

	tabContainer.innerHTML = '';
	tabContainer.appendChild(container);
}

function showBackupDataButton({pageComponents}){
	const { storeRowsContainer, buttonContainer } = pageComponents;

	const imgElementsHasData = storeRowsContainer.querySelectorAll('img[data-hasdata="true"]');

	if(imgElementsHasData.length > 0){
		buttonContainer.classList.remove('w3-hide');
	}
}