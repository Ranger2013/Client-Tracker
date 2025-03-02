import { getValidElement } from "../../../../../../core/utils/dom/elements.js";
import getAllFormIdElements from "../../../../../../core/utils/dom/forms/getAllFormIDElements.js";
import { underscoreToHyphen } from "../../../../../../core/utils/string/stringUtils.js";

export default async function populateByMileForm({ form, manageUser }) {
	try {
		form = getValidElement(form);

		const mileageCharges = await manageUser.getMileageCharges();

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
		const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
		new AppError('Failed to populate the per-mile form.', {
			originalError: err,
			shouldLog: true,
			userMessage: null,
			errorCode: 'RENDER_ERROR',
		}).logError();
	}
}