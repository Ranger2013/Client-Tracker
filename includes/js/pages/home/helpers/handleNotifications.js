import { getValidationToken } from "../../../tracker.js";
import openModal from "../../../utils/modal/openModal.js";
import { getNotificationsAPI } from "../../../utils/network/apiEndpoints.js";
import { fetchData } from "../../../utils/network/network.js";
import noAuthorizationPage from "../../../utils/security/noAuthorizationPage.js";
import getListenersForNotifications from "./getListenersForNotifications.js";

export default async function handleNotifications(updateUserSettings, userDataStructure) {
	try {
		// Check permissions for the app
		if (Notification.permission === 'granted') {
			// Update the status for notifications
			await updateUserSettings('yes', 'notifications', userDataStructure);
		}
		else if (Notification.permission === 'denied') {
			// Update the status for notifications
			await updateUserSettings('no', 'notifications', userDataStructure);
		}
		else {
			// The user had dismissed the notification. Show the notification modal again
			await handleNotificationModal();

			// Set the event listeners
			await getListenersForNotifications(updateUserSettings, userDataStructure);
		}

	}
	catch (err) {
		const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
		await errorLogs('handleNotificationsError.txt', 'Notifications error.', err);
	}
}

async function handleNotificationModal() {
	try{
		const response = await fetchData({api: getNotificationsAPI, token: getValidationToken()});

		if (response.status === 'auth-error') {
			await noAuthorizationPage();
			return;
		}

		if(response.status === 'ok'){
			openModal({content: response.msg});
		}
	}
	catch(err){
		const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
		await errorLogs('handleNotificationModalError.txt', 'Notifications modal error.', err);
	}
}