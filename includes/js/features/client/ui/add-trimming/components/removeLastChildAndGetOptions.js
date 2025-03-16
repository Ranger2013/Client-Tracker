/**
 * Removes the last child element from the container and retrieves the selected option from its select element
 * 
 * @param {HTMLElement} container - The container element from which the last child is removed.
 * @returns {Promise<HTMLOptionElement|null>} - The selected option from the last child's select element, or null f not found.
 */
export default async function removeLastChildAndGetOptions(container) {
	try {
		const lastChild = container.lastElementChild;
		const select = lastChild.querySelector('select[id^="horse-list-"]');
		let selectedOptions = null;
		let index = -1;

		if (select) {
			selectedOptions = select.options[select.selectedIndex];
			index = select.selectedIndex;
			container.removeChild(lastChild);
		}
		return { option: selectedOptions, index };
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: 'We encountered an error, could not get the last option value that was removed. Please refresh the page and start over.',
			displayTarget: 'form-msg',
		});
	}
}