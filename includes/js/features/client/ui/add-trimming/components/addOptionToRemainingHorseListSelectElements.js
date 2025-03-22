/**
 * 
 * @param {HTMLElement} container - The container element containing the horse-list-x select elements.
 * @param {HTMLOptionElement} option - The option to be added to the remaining select elements.
 */
export default async function addOptionToRemainingHorseListSelectElements({container, optionWithIndex}) {
	try {
		const { option, index } = optionWithIndex;

		if (!option) throw new Error('No option provided.');

		container.querySelectorAll('select[id^="horse-list-"]').forEach(select => {
			if (![...select.options].some(opt => opt.value === option.value)) {
				select.add(option.cloneNode(true), index);
			}
		});
	}
	catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.min.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: 'We encountered an error repopulating the horse list select element. Please refresh the page and start over.',
			displayTarget: 'form-msg',
		});
	}
}