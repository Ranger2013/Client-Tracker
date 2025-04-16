import { buildEle, buildElementsFromConfig, buildElementTree } from '../elements.js';

const COMPONENT = 'Build DOM Form Utils';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) console.log(`[${COMPONENT}]`, ...args);
};

/**
 * Creates a div element for displaying error messages with specific styling classes
 * @param {string} id - The base ID that will be used to create the error div's ID (will be suffixed with '-error')
 * @returns {HTMLDivElement} A div element with the specified ID and styling classes, initially hidden
 */
export function buildErrorDiv(id) {
	const errorDiv = buildEle({
		type: 'div',
		attributes: { id: `${id}-error` },
		myClass: ['w3-padding-small', 'w3-margin-small', 'w3-hide'],
	});
	return errorDiv;
}

/**
 * Builds the page container structure with optional client navigation
 * @param {Object} params - Build parameters
 * @param {string} params.pageTitle - The page title text
 * @param {string|null} [params.clientName] - Optional client name for navigation
 * @param {string|null} [params.cID] - Optional client ID
 * @param {string|null} [params.primaryKey] - Optional primary key
 * @returns {Promise<[HTMLElement, HTMLElement]>} Container and card elements
 */
export async function buildPageContainer({ pageTitle, clientName = null, cID = null, primaryKey = null }) {
	try {
		// Define element configurations
		const PAGE_ELEMENTS = {
			container: {
				type: 'div',
				myClass: ['w3-container']
			},
			card: {
				type: 'div',
				myClass: ['w3-card'],
				attributes: { id: 'card' },
			},
			titleContainer: {
				type: 'div',
				myClass: ['w3-center']
			},
			formMsg: {
				type: 'div',
				attributes: { id: 'form-msg' },
				myClass: ['w3-center'],
			},
			title: {
				type: 'h5',
				text: pageTitle,
			},
			anchor: {
				type: 'a',
				myClass: ['w3-text-underline'],
				text: clientName || '',
				attributes: clientName && cID && primaryKey ? {
					'data-component': 'client-navigation',  // Identifies purpose
					'data-clientid': cID,                 // Stores client data
					'data-primarykey': primaryKey,        // Stores key data
					href: `/tracker/clients/appointments/?cID=${cID}&key=${primaryKey}`
				} : {},
			}
		};

		const elements = buildElementsFromConfig(PAGE_ELEMENTS);
		const { container, card, titleContainer, formMsg, title, anchor } = elements;

		if (clientName && cID && primaryKey) {
			title.appendChild(anchor);
		}

		titleContainer.prepend(title);
		card.append(titleContainer, formMsg);

		return [container, card];
	}
	catch (err) {
		const { AppError } = await import("../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
		}, true);
	}
}

/**
 * Builds a submit button section with optional color.
 * @param {string} buttonText - The text to display on the button.
 * @param {string} [buttonColor=null] - Optional CSS class for button color.
 * @returns {Promise<HTMLElement>} The button container element.
 */
export async function buildSubmitButtonSection(buttonText, buttonColor = null, id = null) {
	try {
		if (!buttonText) throw new Error('Button Text is required');

		const PAGE_MAPPING = {
			container: {
				type: 'div',
				attributes: { id: 'button-section' },
				myClass: ['w3-margin-top', 'w3-padding-bottom', 'w3-center']
			},
			button: {
				type: 'button',
				attributes: {
					id: id || 'submit-button',
					type: 'submit',
					name: 'submit'
				},
				myClass: ['w3-button', 'w3-round-large', buttonColor || 'w3-black'],
				text: buttonText
			}
		};

		const elements = buildElementsFromConfig(PAGE_MAPPING);
		const { container, button } = elements;

		container.appendChild(button);
		return container;

	}
	catch (err) {
		const { AppError } = await import("../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
		}, true);
	}
}

/**
 * Builds a section containing submit and delete buttons.
 * @param {Object} params - The parameters for the buttons.
 * @param {string} params.submitButtonText - The text for the submit button.
 * @param {string} params.deleteButtonText - The text for the delete button.
 * @returns {Promise<HTMLElement>} The row containing both buttons.
 */
export async function buildSubmitDeleteButtonSection({ submitButtonText, deleteButtonText, submitButtonIterator = null, deleteButtonIterator = null }) {
	try {
		const submitButtonId = !submitButtonIterator ? 'submit-button' : `submit-button-${submitButtonIterator}`;
		const deleteButtonId = !deleteButtonIterator ? 'delete-button' : `delete-button-${deleteButtonIterator}`;

		const PAGE_MAPPING = {
			type: 'div',
			myClass: ['w3-row', 'w3-padding', 'w3-margin-top'],
			children: {
				submitCol: {
					type: 'div',
					myClass: ['w3-col', 's6', 'w3-padding-small', 'w3-center'],
					children: {
						submitButton: {
							type: 'button',
							attributes: {
								id: submitButtonId,
								type: 'submit',
								name: 'submit'
							},
							myClass: ['w3-button', 'w3-round-large', 'w3-black'],
							text: submitButtonText
						},
					},
				},
				deleteCol: {
					type: 'div',
					myClass: ['w3-col', 's6', 'w3-padding-small', 'w3-center'],
					children: {
						deleteButton: {
							type: 'button',
							attributes: {
								id: deleteButtonId,
								type: 'submit',
								name: 'delete'
							},
							myClass: ['w3-button', 'w3-round-large', 'w3-red'],
							text: deleteButtonText
						},
					},
				},
			},
		};

		const elements = buildElementTree(PAGE_MAPPING);
		debugLog('Elements:', elements);
		return elements;
	}
	catch (err) {
		const { AppError } = await import("../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
		}, true);
	}
}

/**
 * Builds an HTML section with a specified input field.
 * @param {string} labelText - The text for the label.
 * @param {string} inputId - The ID for the input field.
 * @param {string} inputType - The type for the input field.
 * @param {string} inputName - The name for the input field.
 * @param {string} inputTitle - The title for the input field.
 * @param {boolean} [required=true] - Whether the input field is required.
 * @param {string} inputValue - The value for the input element.
 * @param {HTMLElement} [additionalElement=null] - An additional element to append to the input column.
 * @returns {Promise<HTMLElement>} The row element containing the section.
 */
export async function buildTwoColumnInputSection({
	labelText,
	inputID,
	inputType,
	inputName,
	inputTitle,
	required = undefined,
	inputValue = undefined,
	additionalElement = null
}) {
	try {
		// Lazy load for this function
		const { getCurrentTime, getReadableCurrentFutureDate } = await import('../../date/dateUtils.js');
		const { cleanUserOutput } = await import('../../string/stringUtils.js');

		const INPUT_TYPES = {
			date: {
				getDefaultValue: () => getReadableCurrentFutureDate()
			},
			time: {
				getDefaultValue: () => getCurrentTime()
			},
			number: {
				attributes: { step: '.01' }  // Only number type has attributes defined
			}
		};

		// Simplified attributes object
		const inputAttributes = {
			id: inputID,
			type: inputType,
			name: inputName,
			placeholder: inputTitle,
			title: inputTitle,
			required,  // if undefined, won't be included in the object
			value: (cleanUserOutput(inputValue) || undefined) || INPUT_TYPES[inputType]?.getDefaultValue?.() || undefined,
			...INPUT_TYPES[inputType]?.attributes  // if undefined, nothing will be spread
		};

		Object.keys(inputAttributes).forEach(key => inputAttributes[key] === undefined && delete inputAttributes[key]);

		const PAGE_MAPPING = {
			row: { type: 'div', myClass: ['w3-row', 'w3-padding'] },
			colLabel: { type: 'div', myClass: ['w3-col', 'm6'] },
			colInput: { type: 'div', myClass: ['w3-col', 'm6'] },
			input: {
				type: 'input',
				attributes: inputAttributes,
				myClass: ['w3-input', 'w3-border', 'input']
			},
			label: {
				type: 'label',
				attributes: { for: inputID },
				text: labelText
			},
		};

		// Add the conditional elements to the config
		if (inputID === 'app-time') {
			PAGE_MAPPING.appointmentBlock = {
				type: 'div',
				attributes: { id: 'appointment-block' },
				myClass: ['w3-margin-small']
			};
			PAGE_MAPPING.projectedAppointmentBlock = {
				type: 'div',
				attributes: { id: 'projected-appointment-block' },
				myClass: ['w3-margin-small']
			};
		}

		// Build all elements at once
		const elements = buildElementsFromConfig(PAGE_MAPPING);
		const { row, colLabel, colInput, input, label } = elements;

		// Build error div separately since it's already a built element
		const errorDiv = buildErrorDiv(inputID);

		// add the app-time special case
		if (inputID === 'app-time') {
			const { appointmentBlock, projectedAppointmentBlock } = elements;
			colInput.append(input, errorDiv, appointmentBlock, projectedAppointmentBlock);
		}
		else {
			colInput.append(input, errorDiv);
		}

		// Add any additional elements
		if (additionalElement) {
			colInput.appendChild(additionalElement);
		}

		// Assemble and return
		colLabel.appendChild(label);
		row.append(colLabel, colInput);

		return row;

	}
	catch (err) {
		const { AppError } = await import("../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
		}, true);
	}
}

/**
 * Builds an HTML section with two columns, where the second column contains radio buttons.
 * @param {Object} params - The parameters for the function.
 * @param {string} params.labelText - The text for the label in the first column.
 * @param {boolean} [params.required=true] - Whether the radio buttons are required.
 * @param {Array} params.buttons - An array of button objects, each representing a radio button.
 * @param {string} params.buttons[].name - The name attribute for the radio button.
 * @param {string} params.buttons[].value - The value attribute for the radio button.
 * @param {string} params.buttons[].labelText - The text label for the radio button.
 * @param {boolean} [params.buttons[].checked] - Whether the radio button is checked.
 * @returns {Promise<HTMLElement>} A promise that resolves to the row element containing the section.
 */
export async function buildTwoColumnRadioButtonSection({ labelText, required = undefined, buttons }) {
	try {
		const PAGE_MAPPING = {
			row: { type: 'div', myClass: ['w3-row', 'w3-padding'] },
			colOne: { type: 'div', myClass: ['w3-col', 's6'], text: labelText },
			colTwo: { type: 'div', myClass: ['w3-col', 's6'] }
		};

		const elements = buildElementsFromConfig(PAGE_MAPPING);
		const { row, colOne, colTwo } = elements;

		// Build radio buttons
		buttons?.forEach(button => {
			const label = buildEle({
				type: 'label',
				myClass: ['w3-block'],
				text: `${button.labelText} `
			});

			const radioButton = buildEle({
				type: 'input',
				attributes: {
					type: 'radio',
					name: button.name,
					value: button.value,
					...(button.checked && { checked: true }),
					...(required && { required: true })
				}
			});

			label.appendChild(radioButton);
			colTwo.appendChild(label);
		});

		row.append(colOne, colTwo);
		return row;

	}
	catch (err) {
		const { AppError } = await import("../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
		}, true);
	}
}

/**
 * Builds an HTML section with two columns, where the second column contains a select element with options.
 * @param {Object} params - The parameters for the function.
 * @param {string} params.labelText - The text for the label in the first column.
 * @param {string} params.selectID - The ID for the select element.
 * @param {string} params.selectName - The name attribute for the select element.
 * @param {string} params.selectTitle - The title attribute for the select element.
 * @param {boolean} [params.required=true] - Whether the select element is required.
 * @param {Array} params.options - An array of option objects for the select element.
 * @param {string} params.options[].value - The value attribute for the option element.
 * @param {boolean} [params.options[].disabled] - Whether the option element is disabled.
 * @param {boolean} [params.options[].selected] - Whether the option element is selected.
 * @param {string} params.options[].text - The display text for the option element.
 * @returns {Promise<HTMLElement>} A promise that resolves to the row element containing the section.
 */
export async function buildTwoColumnSelectElementSection({
	labelText,
	selectID,
	selectName,
	selectTitle,
	required = undefined,
	options
}) {
	try {
		const PAGE_MAPPING = {
			row: { type: 'div', myClass: ['w3-row', 'w3-padding'] },
			colOne: { type: 'div', myClass: ['w3-col', 'm6'] },
			colTwo: { type: 'div', myClass: ['w3-col', 'm6'] },
			label: {
				type: 'label',
				attributes: { for: selectID },
				text: labelText
			},
			select: {
				type: 'select',
				attributes: {
					id: selectID,
					name: selectName,
					title: selectTitle,
					required
				},
				myClass: ['w3-input', 'w3-border']
			}
		};

		// Build base elements
		const elements = buildElementsFromConfig(PAGE_MAPPING);
		const { row, colOne, colTwo, label, select } = elements;

		const errorDiv = buildErrorDiv(selectID);

		// Add options if they exist
		if (options?.length > 0) {
			options.forEach(option => {
				const { value, disabled, selected, text, ...otherAttributes } = option;
				select.appendChild(buildEle({
					type: 'option',
					attributes: {
						...otherAttributes,  // Spread any additional attributes
						value,
						...(disabled && { disabled: true }),
						...(selected && { selected: true })
					},
					text,
				}));
			});
		}

		// Assemble and return
		colOne.appendChild(label);
		colTwo.append(select, errorDiv);
		row.append(colOne, colTwo);
		return row;

	}
	catch (err) {
		const { AppError } = await import("../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
		}, true);
	}
}

export async function buildTwoColumnTextareaSection({
	labelText,
	textareaID,
	textareaName,
	textareaTitle,
	required = undefined,
	textareaValue = null,
	rows = 10,
}) {
	try {
		const { cleanUserOutput } = await import('../../string/stringUtils.js');
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

		const PAGE_MAPPING = {
			row: { type: 'div', myClass: ['w3-row', 'w3-padding'] },
			colLabel: { type: 'div', myClass: ['w3-col', 'm6'] },
			label: {
				type: 'label',
				attributes: { for: textareaID },
				text: labelText
			},
			colInput: { type: 'div', myClass: ['w3-col', 'm6'] },
			textarea: {
				type: 'textarea',
				attributes,
				myClass: ['w3-input', 'w3-border'],
				text: textareaValue || ''
			}
		};

		const elements = buildElementsFromConfig(PAGE_MAPPING);
		const { row, colLabel, label, colInput, textarea } = elements;

		const errorDiv = buildErrorDiv(textareaID);

		// Put all parts together
		colLabel.appendChild(label);
		colInput.append(textarea, errorDiv);

		// Append main structure
		row.append(colLabel, colInput);

		return row;
	}
	catch (err) {
		const { AppError } = await import("../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
		}, true);
	}
}