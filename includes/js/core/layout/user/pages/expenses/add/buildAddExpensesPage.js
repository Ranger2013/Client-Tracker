import { buildEle } from '../../../../../utils/dom/elements.js';
import { buildPageContainer, buildSubmitButtonSection, buildTwoColumnInputSection, buildTwoColumnSelectElementSection, buildTwoColumnTextareaSection } from '../../../../../utils/dom/forms/buildUtils.js';
import { removeListeners } from '../../../../../utils/dom/listeners.js';
import { clearMsg } from '../../../../../utils/dom/messages.js';

// Set up debug mode
const COMPONENT = 'Build Add Expenses Page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) console.log(`[${COMPONENT}]`, ...args);
};

// Set event listener component
const COMPONENT_ID = 'add-expenses';

// Set up category options
const CATEGORY_OPTIONS = [
	{ value: 'null', text: '-- Select a Category --' },
	{ value: '1', text: 'Tools/Supplies' },
	{ value: '2', text: 'Attire' },
	{ value: '3', text: 'Schools' },
	{ value: '4', text: 'Advertising' },
	{ value: '5', text: 'Food' },
	{ value: '6', text: 'Misc' },
];

export default async function buildExpensesPage({ mainContainer, manageClient, manageUser }) {
	try {
		// Clear any page-msg
		clearMsg({ container: 'page-msg' });
		const [pageComponents, formComponents] = await Promise.all([
			buildPageComponents(),
			buildFormComponents(),
		]);

		renderPage({ mainContainer, pageComponents, formComponents });

		await initializeUIFunction({ mainContainer, manageClient, manageUser, componentId: COMPONENT_ID });

		// Handle garbage clean up for event listeners
		return () => removeListeners(COMPONENT_ID);
	}
	catch (err) {
		throw err;
	}
}

async function buildPageComponents() {
	const [container, card] = await buildPageContainer({
		pageTitle: 'Add Expenses',
	});

	return {
		container,
		card,
	};
}

async function buildFormComponents() {
	const form = buildEle({
		type: 'form',
		attributes: { id: 'add-expenses-form' },
	})

	const [
		storeSection,
		dateSection,
		categorySection,
		priceSection,
		itemDescriptionSection,
		submitButtonSection,
	] = await Promise.all([
		buildTwoColumnInputSection({
			labelText: 'Store:',
			inputID: 'store',
			inputType: 'text',
			inputName: 'store',
			inputTitle: 'Store Name',
			required: true,
		}),
		buildTwoColumnInputSection({
			labelText: 'Date:',
			inputID: 'date',
			inputType: 'date',
			inputName: 'date',
			inputTitle: 'Date of Purchase',
			required: true,
			inputValue: new Date().toISOString().slice(0, 10),
		}),
		buildTwoColumnSelectElementSection({
			labelText: 'Category:',
			selectID: 'category',
			selectName: 'category',
			selectTitle: 'Category of Expense',
			required: true,
			options: CATEGORY_OPTIONS,
		}),
		buildTwoColumnInputSection({
			labelText: 'Price:',
			inputID: 'price',
			inputType: 'number',
			inputName: 'price',
			inputTitle: 'Total Price of Purchase',
			required: true,
			additionalElement: buildEle({ type: 'span', myClass: ['w3-text-red', 'w3-small'], text: 'Do not use a $ sign.' }),
		}),
		buildTwoColumnTextareaSection({
			labelText: 'Item Description:',
			textareaID: 'item-description',
			textareaName: 'item_description',
			textareaTitle: 'Description of Purchase',
			required: true,
			rows: 10,
		}),
		buildSubmitButtonSection('Add Expenses'),
	]);

	return {
		form,
		storeSection,
		dateSection,
		categorySection,
		priceSection,
		itemDescriptionSection,
		submitButtonSection,
	};
}

function renderPage({ mainContainer, pageComponents, formComponents }) {
	const { container, card } = pageComponents;
	const { form, ...restOfFormComponents } = formComponents;

	form.append(...Object.values(restOfFormComponents));
	card.append(form);
	container.append(card);

	// Clear the main container and add the new content
	mainContainer.innerHTML = '';
	mainContainer.append(container);
}

async function initializeUIFunction({ mainContainer, manageClient, manageUser, componentId }) {
	const { default: addExpenses } = await import('../../../../../../features/user/ui/expenses/add/expensesJS.js');
	addExpenses({ mainContainer, manageClient, manageUser, componentId, categoryOptions: CATEGORY_OPTIONS });
}