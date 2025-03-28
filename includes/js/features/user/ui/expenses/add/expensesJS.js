import { disableEnableSubmitButton } from '../../../../../core/utils/dom/elements.js';
import displayFormValidationErrors from '../../../../../core/utils/dom/forms/displayFormValidationErrors.js';
import { addListener } from '../../../../../core/utils/dom/listeners.js';
import { clearMsg, safeDisplayMessage } from '../../../../../core/utils/dom/messages.js';
import { top } from '../../../../../core/utils/window/scroll.js';

// Set up debug mode
const COMPONENT = 'Add Expenses';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) console.log(`[${COMPONENT}]`, ...args);
};

export default async function addExpenses({ mainContainer, manageClient, manageUser, componentId, categoryOptions }) {
	try {
		// Set up the static event listeners for the page
		const staticEvents = {
			'focusin:store': (evt) => {
				clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
				disableEnableSubmitButton('submit-button');
			},
			'focusin:date': (evt) => {
				clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
				disableEnableSubmitButton('submit-button');
			},
			'focusin:category': (evt) => {
				clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
				disableEnableSubmitButton('submit-button');
			},
			'focusin:price': (evt) => {
				clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
				disableEnableSubmitButton('submit-button');
			},
			'focusin:item-description': (evt) => {
				clearMsg({ container: `${evt.target.id}-error`, hide: true, input: evt.target });
				disableEnableSubmitButton('submit-button');
			},
			'submit:add-expenses-form': async (evt) => {
				evt.preventDefault();
				await handleAddExpensesFormSubmission({ evt, mainContainer, manageClient, manageUser, categoryOptions});
			},
		};

		addListener({
			elementOrId: 'card',
			eventType: ['focusin', 'submit'],
			handler: (evt) => {
				debugLog('Event Type: ', evt.type);
				const keyPath = `${evt.type}:${evt.target.id}`;
				debugLog('KeyPath: ', keyPath);
				if (staticEvents[keyPath]) {
					staticEvents[keyPath](evt);
				}
			},
			componentId,
		});
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		});
	}
}

async function handleAddExpensesFormSubmission({ evt, mainContainer, manageClient, manageUser, categoryOptions }) {
	try {
		debugLog('Form submission event triggered');
		// Clear any previous messages
		clearMsg({ container: 'form-msg' });

		const userData = Object.fromEntries(new FormData(evt.target));

		const errors = await validateAddExpensesForm({userData, options: categoryOptions});
		debugLog('Errors: ', errors);
		if (errors.length > 0) {
			displayFormValidationErrors(errors);
			disableEnableSubmitButton('submit-button');
			return;
		}

		const response = await handleFormSubmission(userData);

		if (response) {
			displaySuccessMessageAndResetForm(evt);
			return;
		}
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			userMessage: AppError.BaseMessages.forms.submissionFailed,
			displayTarget: 'form-msg',
		});

		disableEnableSubmitButton('submit-button');
	}
}

async function validateAddExpensesForm({userData, options}) {
	try {
		debugLog('options: ', options);
		debugLog('Array.from(options): ', options.some(option => option.value !== 'null' && option.value === userData?.category));
		const validationMapping = {
			store: {
				isValid: () => userData?.store?.trim() !== '',
				errorMessage: 'Store name is required',
			},
			date: {
				isValid: () => userData?.date?.trim() !== '',
				errorMessage: 'Date of purchase is required',
			},
			category: {
				isValid: () => options.some(option => option.value !== 'null' && option.value === userData?.category),
				errorMessage: 'Please select a valid category',
			},
			price: {
				isValid: () => userData?.price?.trim() !== '' && parseFloat(userData?.price) > 0,
				errorMessage: 'Price must be a positive number',
			},
			'item-description': {
				isValid: () => userData['item-description']?.trim() !== '',
				errorMessage: 'Item description is required',
			},
		};

		return Object.entries(validationMapping)
			.filter(([key, value]) => !value.isValid())
			.map(([key, value]) => ({ input: key, msg: value.errorMessage }));
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.FORM_VALIDATION_ERROR,
			userMessage: AppError.BaseMessages.forms.validationFailed,
			displayTarget: 'form-msg',
		}, true);
	}
}

async function handleFormSubmission(userData) {
	const { default: ManageExpenses } = await import("../../../../user/models/ManageExpenses.js");

	const manageExpenses = new ManageExpenses();

	const backupData = {
		add_expenses: true,
		...userData,
	};

	return await manageExpenses.addExpense(backupData);
}

function displaySuccessMessageAndResetForm(evt) {
	safeDisplayMessage({
		elementId: 'form-msg',
		message: 'Expense added successfully',
		isSuccess: true,
	});

	evt.target.reset();
	top();

	// Add the date value back to the date element
	const today = new Date().toISOString().slice(0, 10);
	document.getElementById('date').value = today;
}