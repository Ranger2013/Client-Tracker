import { getValidElement } from "../../../../../../core/utils/dom/elements.min.js";
import getAllFormIdElements from "../../../../../../core/utils/dom/forms/getAllFormIDElements.min.js";
import { underscoreToHyphen } from "../../../../../../core/utils/string/stringUtils.min.js";

export default async function populateByMileForm({ form, manageUser }) {
	try {
		form = getValidElement(form);

		let mileageCharges = null;
		try{
			mileageCharges = await manageUser.getMileageCharges();
		}
		catch(err){
			// Fail silently
			const { AppError } = await import("../../../../../../core/errors/models/AppError.min.js");
			AppError.handleError(err, {
				errorCode: AppError.Types.RENDER_ERROR,
				userMessage: null,
			});
		}


		if (mileageCharges?.cost_per_mile != null && mileageCharges?.starting_mile != null) {
			const elements = getAllFormIdElements(form);

			// Direct property mapping - no transformation needed
			Object.entries(mileageCharges).forEach(([key, value]) => {

				const id = underscoreToHyphen(key);
				if (elements[id]) {
					elements[id].value = value ?? '';
				}
			});
		}
	}
	catch (err) {
		// Fail silently
		const { AppError } = await import("../../../../../../core/errors/models/AppError.min.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.FORM_POPULATION_ERROR,
			userMessage: null,
		});
	}
}