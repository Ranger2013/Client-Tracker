import { getReadableCurrentFutureDate } from "../../../../date/dateUtils.js";
import { buildEle, clearMsg } from "../../../../dom/domUtils.js";
import { removeAllListeners } from "../../../../event-listeners/listeners.js";
import buildPageContainer from "../../../helpers/buildPageContainer.js";
import buildSubmitButtonSection from "../../../helpers/buildSubmitButtonSection.js";
import buildTwoColumnInputSection from "../../../helpers/buildTwoColumnInputSection.js";
import buildTwoColumnSelectElementSection from "../../../helpers/buildTwoColumnSelectElementSection.js";
import buildTwoColumnTextareaSection from "../../../helpers/buildTwoColumnTextareaSection.js";

export default async function buildAddExpensesPage({ mainContainer }) {
	try {
		// Clear any page msgs
		clearMsg({ container: 'page-msg' });

		const [
			[container, card],
			storeSection,
			dateSection,
			categorySection,
			priceSection,
			descriptionSection,
			buttonSection] = await Promise.all([
				buildPageContainer({
					pageTitle: 'Add Expenses',
				}),
				// Store Section
				buildTwoColumnInputSection({
					labelText: 'Store:',
					inputID: 'store',
					inputType: 'text',
					inputName: 'store',
					inputTitle: 'Store Name',
					required: false,
				}),
				// Date Section
				buildTwoColumnInputSection({
					labelText: 'Date:',
					inputID: 'date',
					inputType: 'date',
					inputName: 'date',
					inputTitle: 'Date of Expense',
					required: true,
					inputValue: getReadableCurrentFutureDate(),
				}),
				// Category Section
				buildTwoColumnSelectElementSection({
					labelText: 'Category:',
					selectID: 'category',
					selectName: 'category',
					selectTitle: 'Select a Category',
					required: true,
					options: [
						{ value: 'null', text: '-- Select a Category --', selected: true },
						{ value: '1', text: 'Tools/Supplies' },
						{ value: '2', text: 'Attire' },
						{ value: '3', text: 'Schools/Clinics' },
						{ value: '4', text: 'Advertising' },
						{ value: '5', text: 'Food' },
						{ value: '6', text: 'Misc' },
					],
				}),
				// Price Section
				buildTwoColumnInputSection({
					labelText: 'Price:',
					inputID: 'price',
					inputType: 'number',
					inputName: 'price',
					inputTitle: '0.00 Format',
					required: true,
					additionalElement: buildEle({
						type: 'div',
						myClass: ['w3-small', 'w3-text-red'],
						text: '* Do not add a $',
					}),
				}),
				// Description Section
				buildTwoColumnTextareaSection({
					labelText: 'Item Description:',
					textareaID: 'description',
					textareaName: 'description',
					textareaTitle: 'Description of Items',
					required: true,
				}),
				// Button Section
				buildSubmitButtonSection('Add Expenses')
			]);

		// Build the form element
		const form = buildEle({
			type: 'form',
			attributes: { id: 'expense-form' },
		});

		// put it all together
		container.appendChild(card);
		card.appendChild(form);
		form.appendChild(storeSection);
		form.appendChild(dateSection);
		form.appendChild(categorySection);
		form.appendChild(priceSection);
		form.appendChild(descriptionSection);
		form.appendChild(buttonSection);

		// Append the main container
		mainContainer.innerHTML = '';
		mainContainer.appendChild(container);

		// Get the add expenses js file
		const { default: addExpenses } = await import("../../../../../pages/expenses/add/addExpensesJS.js");
		await addExpenses();

		return removeAllListeners;
	}
	catch (err) {
		const { handleError } = await import("../../../../error-messages/handleError.js");
		await handleError('buildAddExpensesPageError', 'Error building add expenses page: ', err, 'Unable to build the add expenses page. Please try again later.', 'page-msg');
	}
}