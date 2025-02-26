import { clearMsg } from "../messages.js";
import { disableEnableSubmitButton } from "../elements.js";

export function formatPhone(evt, errorEle) {
	let cleaned = ('' + evt.target.value).replace(/\D/g, '');
	let match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

	if (match) {
		let pn = match[1] + '-' + match[2] + '-' + match[3];
		evt.target.value = pn;
		clearMsg({ container: errorEle, hide: true })
		// Enable the submit button
		disableEnableSubmitButton(submitButton);
	}
	else {
		myError(errorEle, 'Please use the correct format.');
		// Disable the submit button
		disableEnableSubmitButton(submitButton);
	}
}
