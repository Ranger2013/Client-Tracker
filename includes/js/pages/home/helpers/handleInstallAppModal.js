import { getValidationToken } from "../../../tracker.js";
import openModal from "../../../utils/modal/openModal.js";
import { getInstallAppAPI } from "../../../utils/network/apiEndpoints.js";
import { fetchData } from "../../../utils/network/network.js";
import noAuthorizationPage from "../../../utils/security/noAuthorizationPage.js";
import installApp from "./installApp.js";
import updateUserSettings from "./updateUserSettings.js";

export default async function handleInstallAppModal(userDataStructure) {
	console.log('In handleInstallAppModal');

	try {
		const response = await fetchData({ api: getInstallAppAPI, token: getValidationToken() });
		console.log('In handleInstallAppModal: response: ', response);

		if (response.status === 'auth-error') {
			await noAuthorizationPage();
			return;
		}

		if (response.status === 'ok') {
			openModal({ content: response.msg });

			// Get the event listeners for the modal content
			getListenersForInstall(userDataStructure);
		}
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
		await errorLogs('handleInstallAppModalError.txt', 'App install modal error.', err);
	}
}

function getListenersForInstall(userDataStructure) {
	const yes = document.getElementById('install-yes');
	const no = document.getElementById('install-no');
	const never = document.getElementById('install-never');

	if (yes) yes.addEventListener('click', installApp);
	if (no) no.addEventListener('click', async () => await updateUserSettings('no', 'installApp', userDataStructure));
	if (never) never.addEventListener('click', async () => await updateUserSettings('never', 'installApp', userDataStructure));
}