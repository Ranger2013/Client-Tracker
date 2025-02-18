
import { buildEle } from "../../../../../utils/dom/domUtils.js";

export default async function buildNotificationsPage(tabContentContainer) {
	try {
		// build the container
		const container = buildEle({
			type: 'div',
			myClass: ['w3-container']
		});

		const titleContainer = buildEle({
			type: 'div',
			myClass: ['w3-center']
		});

		const title = buildEle({
			type: 'h5',
			text: 'Notifications'
		});

		const row = buildEle({
			type: 'div',
			myClass: ['w3-rows']
		});

		const firstCol = buildEle({
			type: 'div',
			myClass: ['w3-col', 's10', 'w3-center'],
			text: 'Turn Notifications On/Off:&nbsp;'
		});

		const secondCol = buildEle({
			type: 'div',
			myClass: ['w3-col', 's2']
		});

		const label = buildEle({
			type: 'label',
			myClass: ['w3-switch']
		});

		const notificationInput = buildEle({
			type: 'input',
			attributes: { id: 'notification-checkbox', type: 'checkbox' }
		});

		const notificationSlider = buildEle({
			type: 'span',
			attributes: { id: 'slider' },
			myClass: ['w3-slider', 'round']
		});

		label.appendChild(notificationInput);
		label.appendChild(notificationSlider);
		secondCol.appendChild(label);
		row.appendChild(firstCol);
		row.appendChild(secondCol);
		titleContainer.appendChild(title);
		container.appendChild(titleContainer);
		container.appendChild(row);

		// Clear the container
		tabContentContainer.innerHTML = '';

		tabContentContainer.appendChild(container);
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../../../utils/error-messages/errorLogs.js");
		await errorLogs('buildNotificationsPageError', 'Build notifications page error: ', err);
	}
}