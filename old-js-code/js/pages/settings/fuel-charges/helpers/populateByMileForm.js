import getAllFormIdElements from "../../../../utils/dom/getAllFormIDElements.js";
import { underscoreToHyphen } from "../../../../utils/string/stringUtils";

export default async function populateByMileForm({ form, manageUser }) {
	try {
		if (typeof form === 'string') {
			form = document.getElementById(form);
		}

		const mileageCharges = await manageUser.getMileageCharges();

		if (mileageCharges?.cost_per_mile != null && mileageCharges?.starting_mile != null) {
			const elements = await getAllFormIdElements(form);

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
		const { handleError } = await import("../../../../utils/error-messages/handleError.js");
		await handleError({
			filename: 'populateByMileFormError',
			consoleMsg: 'Populate by mile form error: ',
			err
		});
	}
}