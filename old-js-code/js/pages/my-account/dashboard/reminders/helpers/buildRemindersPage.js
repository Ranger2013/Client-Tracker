
import { buildEle } from "../../../../../utils/dom/domUtils.js";

export default async function buildRemindersPage(tabContentContainer) {
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
			text: 'Reminders'
		});

		const row = buildEle({
			type: 'div',
			myClass: ['w3-rows']
		});

		const firstCol = buildEle({
			type: 'div',
			myClass: ['w3-col', 's10', 'w3-center'],
			text: 'Turn Reminders On/Off:&nbsp;'
		});

		const secondCol = buildEle({
			type: 'div',
			myClass: ['w3-col', 's2']
		});

		const label = buildEle({
			type: 'label',
			myClass: ['w3-switch']
		});

		const reminderInput = buildEle({
			type: 'input',
			attributes: { id: 'reminder-checkbox', type: 'checkbox' }
		});

		const reminderSlider = buildEle({
			type: 'span',
			attributes: { id: 'slider' },
			myClass: ['w3-slider', 'round']
		});

		label.appendChild(reminderInput);
		label.appendChild(reminderSlider);
		secondCol.appendChild(label);
		row.appendChild(firstCol);
		row.appendChild(secondCol);
		titleContainer.appendChild(title);
		container.appendChild(titleContainer);
		container.appendChild(row);

		// remove the page content
		tabContentContainer.innerHTML = '';

		// Add the reminders page
		tabContentContainer.appendChild(container);
	}
	catch (err) {
		const {default: errorLogs} = await import("../../../../../utils/error-messages/errorLogs.js");
		await errorLogs('buildRemindersPageError', 'Build reminders page error: ', err);
		throw err;
	}
}