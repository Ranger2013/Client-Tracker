import { buildEle } from "../../dom/domUtils";
import { cleanUserOutput } from "../../string/stringUtils.js";
import buildErrorDiv from "./buildErrorDiv.js";

export default async function buildTwoColumnTextareaSection({
	labelText,
	textareaID,
	textareaName,
	textareaTitle,
	required = true,
	textareaValue = null,
	rows = 10,
}) {
	try {
		// Set the attributes for the textarea element
		const attributes = {
			id: textareaID || undefined,
			name: textareaName || undefined,
			placeholder: textareaTitle || undefined,
			title: textareaTitle || undefined,
			rows: rows || undefined,
			required: required || undefined,
		};

		// Remove undefined attributes
		Object.keys(attributes).forEach(key => attributes[key] === undefined && delete attributes[key]);

		const row = buildEle({ type: 'div', myClass: ['w3-row', 'w3-padding'] });
		const colLabel = buildEle({ type: 'div', myClass: ['w3-col', 'm6'] });
		const label = buildEle({ type: 'label', attributes: { for: textareaID }, text: labelText });
		const colInput = buildEle({ type: 'div', myClass: ['w3-col', 'm6'] });
		const textarea = buildEle({ type: 'textarea', attributes, myClass: ['w3-input', 'w3-border'], text: cleanUserOutput(textareaValue) || '',
		});
		const errorDiv = buildErrorDiv(textareaID);

		// Put it all together
		row.appendChild(colLabel);
		colLabel.appendChild(label);
		row.appendChild(colInput);
		colInput.appendChild(textarea);
		colInput.appendChild(errorDiv);

		return row;
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
		await errorLogs('buildTwoColumnInputSectionError', 'Build Two Column Input Section Error: ', err);
		throw err;
	}
}