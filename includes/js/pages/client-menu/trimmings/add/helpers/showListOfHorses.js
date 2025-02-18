import ManageClient from "../../../../../classes/ManageClient.js";
import ManageUser from "../../../../../classes/ManageUser.js";
import { buildGenericSelectOptions } from "../../../../../utils/dom/buildGenericSelectOptions.js";
import { clearMsg, disableEnableSubmitButton, myError } from "../../../../../utils/dom/domUtils.js";
import { ucwords, underscoreToSpaces } from "../../../../../utils/string/stringUtils.js";
import calculateTotalCost from "./calculateTotalCost.js";
import buildHorseListSelectElements from "./showHorseListSelectElements.js";
import { updateTrimCost } from "./updateTrimCost.js";
import autoFillHorseList from "./autoFillHorseList.js";
import { updateAllSelectElements } from "./updateHorseListSelectElements.js";
const ERROR_MSG = 'We encountered an error. Unable to show the list of horses at this time.';

/**
 * Show the list of horses based on user input.
 * @param {Object} params - The parameters.
 * @param {Event} params.evt - The event object.
 * @param {HTMLElement|string} params.horseListContainer - The container for the horse list.
 * @param {string} params.primaryKey - The primary key for the client.
 */
export default async function showListOfHorses({ evt, horseListContainer, primaryKey }) {
	try {
		clearMsg({ container: 'form-msg' });
		horseListContainer = getHorseListContainer(horseListContainer);
		if (!horseListContainer) return;

		const numberHorsesInput = getNumberHorsesInput(evt);
		if (numberHorsesInput === 0) {
			horseListContainer.innerHTML = '';
			return;
		}

		const { clientHorses, clientTotalHorses } = await getClientInfo(primaryKey);
		const userFarrierPrices = await getUserFarrierPrices();
		const optionsConfig = getOptionsConfig(clientHorses, userFarrierPrices);

		const horseListChildren = horseListContainer.children.length;
		const horseList = await handleShowingNumberOfHorses({
			evt,
			horseListContainer,
			clientTotalHorses,
			farrierPrices: userFarrierPrices,
			optionsConfig,
			containerChildren: horseListChildren,
		});

		horseList?.forEach(list => horseListContainer.appendChild(list));

		// Get the final number of horses
		const numberHorses = document.getElementById('number-horses').value;

		await Promise.all([
			updateTrimCost({ blockElementNode: horseListContainer, numberHorses, userFarrierPrices }),
			calculateTotalCost(),
		]);

		// Enable/disable the submit button
		await disableEnableSubmitButton('submit-button');

	}
	catch (err) {
		handleError(err, horseListContainer);
	}
}

/**
 * Get the horse list container element.
 * @param {HTMLElement|string} horseListContainer - The container for the horse list.
 * @returns {HTMLElement|null} The horse list container element or null if not found.
 */
function getHorseListContainer(horseListContainer) {
	if (typeof horseListContainer === 'string') {
		horseListContainer = document.getElementById(horseListContainer);
		if (!horseListContainer) {
			myError('form-msg', 'Unable to find the horse list container.');
			return null;
		}
	}
	return horseListContainer;
}

/**
 * Get the number of horses input by the user.
 * @param {Event} evt - The event object.
 * @returns {number|null} The number of horses input or null if empty.
 */
function getNumberHorsesInput(evt) {
	return evt.target.value === '' ? null : Number(evt.target.value);
}

/**
 * Get the client information.
 * @param {string} primaryKey - The primary key for the client.
 * @returns {Promise<Object>} The client information.
 */
async function getClientInfo(primaryKey) {
	const manageClient = new ManageClient();
	const clientInfo = await manageClient.getClientInfo({ primaryKey });
	const clientHorses = clientInfo?.horses || [];
	const clientTotalHorses = clientHorses.length > 0 ? clientHorses.length : 1;
	return { clientHorses, clientTotalHorses };
}

/**
 * Get the user farrier prices.
 * @returns {Promise<Object>} The user farrier prices.
 */
async function getUserFarrierPrices() {
	const manageUser = new ManageUser();
	return await manageUser.getFarrierPrices();
}

/**
 * Get the options configuration for the select elements.
 * @param {Array} clientHorses - The list of client horses.
 * @param {Object} userFarrierPrices - The user farrier prices.
 * @returns {Object} The options configuration.
 */
function getOptionsConfig(clientHorses, userFarrierPrices) {
	const { accessories: accessoryPrices, ...farrierPrices } = userFarrierPrices;
	return {
		horseListOptionsConfig: {
			list: clientHorses,
			value: opt => `${opt.hID}:${opt.horse_name}`,
			text: opt => opt.horse_name,
		},
		farrierPricesOptionsConfig: {
			list: Object.entries(farrierPrices)
				.filter(([key, value]) => value !== '' && value !== '0.00' && value !== 0.00)
				.reduce((acc, [key, value]) => {
					const isTrim = key.includes('trim');
					if (isTrim && !acc.trim) {
						acc.trim = true;
						acc.list.push({ shoe: 'trim', price: 'xxx' });
					} else if (!isTrim) {
						acc.list.push({ shoe: key, price: value });
					}
					return acc;
				}, { trim: false, list: [] })
				.list,
			value: opt => `${opt.shoe}:${opt.price}`,
			text: opt => ucwords(underscoreToSpaces(opt.shoe)),
		},
		accessoryOptionsConfig: {
			list: Object.entries(accessoryPrices)
				.filter(([type, items]) => items.length > 0)
				.flatMap(([type, items]) => items.map(item => ({ type, acc: item.name || type, price: item.cost }))),
			value: opt => `${opt.type}:${opt.acc}:${opt.price}`,
			text: opt => ucwords(opt.acc),
		},
	};
}

/**
 * Handle errors by displaying an error message.
 * @param {Error} err - The error object.
 * @param {HTMLElement} horseListContainer - The container for the horse list.
 */
async function handleError(err, horseListContainer) {
	console.warn('Show list of horses error: ', err);

	const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
	await handleError(
		'showListOfHorsesError',
		'Show list of horses error: ',
		err,
		ERROR_MSG,
		horseListContainer
	);
}

/**
 * Handle showing the number of horses based on user input.
 * @param {Object} params - The parameters.
 * @param {Event} params.evt - The event object.
 * @param {HTMLElement} params.horseListContainer - The container for the horse list.
 * @param {number} params.clientTotalHorses - The total number of client horses.
 * @param {Object} params.farrierPrices - The farrier prices.
 * @param {Object} params.optionsConfig - The options configuration.
 * @param {number} params.containerChildren - The number of children in the horse list container.
 * @returns {Promise<Array>} The list of horse elements to display.
 */
async function handleShowingNumberOfHorses({ evt, horseListContainer, clientTotalHorses, farrierPrices, optionsConfig, containerChildren }) {
	try {
		let numberHorsesInput = evt.target.value === '' ? null : Number(evt.target.value);

		clearMsg({ container: 'number-horses-error', hide: true, input: 'number-horses' });

		if (!numberHorsesInput) {
			myError('number-horses-error', 'Please enter the number of horses.', 'number-horses');
			return;
		}

		// Handle max horses boundary condition first
		if (numberHorsesInput >= clientTotalHorses) {
			if (numberHorsesInput > clientTotalHorses) {
				myError('form-msg', 'You cannot select more horses than the client has.');
				numberHorsesInput = clientTotalHorses;
				evt.target.value = clientTotalHorses;
			}

			horseListContainer.innerHTML = '';
			const autoFill = await autoFillHorseList({ totalHorses: clientTotalHorses, optionsConfig });

			// Keep only the selected option for each select
			autoFill.map(options => options.querySelector('select[id^="horse-list-"]'))
				.forEach(select => {
					const selectedOption = select.options[select.selectedIndex];
					Array.from(select.options).forEach(option => {
						if (option !== selectedOption) {
							select.removeChild(option);
						}
					});
				});

			return autoFill;
		}

		// Handle removing horses case
		if (numberHorsesInput < containerChildren) {
			let childList = containerChildren;
			let removedOptions = [];

			const [removeLastOption, addNewOption] = await Promise.all([
				import("./removeLastChildAndGetOption.js"),
				import("./addOptionToRemainingHorseListSelectElements.js"),
			]);
			const { default: removeLastChildAndGetOptions } = removeLastOption;
			const { default: addOptionToRemainingHorseListSelectElements } = addNewOption;

			while (childList > numberHorsesInput) {
				const selectedOptions = await removeLastChildAndGetOptions(horseListContainer);
				if (selectedOptions) removedOptions.push(selectedOptions);
				childList--;
			}

			removedOptions.forEach(optionWithIndex =>
				addOptionToRemainingHorseListSelectElements(horseListContainer, optionWithIndex));

			return [];
		}

		horseListContainer.innerHTML = '';
		const buildShowHorseList = await autoFillHorseList({ totalHorses: numberHorsesInput, optionsConfig });

		// Get and track selected horses
		const selectedHorses = buildShowHorseList.map(options => {
			const select = options.querySelector('select[id^="horse-list-"]');
			return select.options[select.selectedIndex].value;
		});

		// Remove already selected horses from other dropdowns
		buildShowHorseList.map(options => options.querySelector('select[id^="horse-list-"]'))
			.forEach(select => {
				const selectedOption = select.options[select.selectedIndex];
				Array.from(select.options).forEach(option => {
					if (option !== selectedOption && selectedHorses.includes(option.value)) {
						select.removeChild(option);
					}
				});
			});

		return buildShowHorseList;
	}
	catch (err) {
		const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
		await handleError(
			'handleShowingNumberOfHorsesError',
			'Handle showing number of horses error: ',
			err,
		);
		throw err;
	}
}