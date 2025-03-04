import { getValidElement } from '../../../../../../core/utils/dom/elements.js';
import getAllFormIdElements from '../../../../../../core/utils/dom/forms/getAllFormIDElements.js';

export default async function populateColorOptionsForm({ form, manageUser }) {
	try{
		const userColors = await manageUser.getColorOptions();
		
		console.log('User Colors:', userColors);
		
		if(!userColors || Object.keys(userColors).length === 0){
			return;
		}

		// Convert form to a valid element if it is a string
		form = getValidElement(form);

		// Get all form elements
		const colorInputs = getAllFormIdElements(form);

		console.log(colorInputs);

		Object.entries(colorInputs).forEach(([_, element]) => {
			if(userColors[element.name] !== null){
				element.value = userColors[element.name];
			}

			document.getElementById(`${element.id}-display`).style.backgroundColor = userColors[element.name];
		});		
	}
	catch(err){
		// Die silently
		const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.FORM_POPULATION_ERROR,
			userMessage: null,
		});
	}
}