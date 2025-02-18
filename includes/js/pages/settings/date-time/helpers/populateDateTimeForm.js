
import errorLogs from "../../../../utils/error-messages/errorLogs.js";
import { cleanUserOutput } from "../../../../utils/string/stringUtils.js";

/**
 * Populates the date and time form with user settings.
 *
 * @param {Object} manageUser - The user management object that provides user-related functions.
 * @param {Object} domElements - An object containing references to the DOM elements needed for the function.
 * @param {HTMLElement} domElements.timeZone - The select element for the time zone.
 * @param {HTMLElement} domElements.dateFormat - The select element for the date format.
 * @returns {Promise<void>} A promise that resolves when the form is populated.
 */
export default async function populateDateTimeForm(manageUser, domElements) {
	const {
		 timeZone,
		 dateFormat,
	} = domElements;

	try {
		 // Get the date time options
		 const dateTime = await manageUser.getDateTimeOptions();

		 if (dateTime && dateTime.date_format && dateTime.time_format && dateTime.time_zone) {
			  const dateFormatValue = cleanUserOutput(dateTime.date_format);
			  const timeFormatValue = cleanUserOutput(dateTime.time_format);
			  const timeZoneValue = cleanUserOutput(dateTime.time_zone);

			  // Set selected time zone
			  for (const zone of timeZone) {
					if (timeZoneValue && zone.value === timeZoneValue) {
						 zone.selected = true;
						 break;
					}
			  }

			  // Set selected date format
			  for (const format of dateFormat) {
					if (dateFormatValue && format.value === dateFormatValue) {
						 format.selected = true;
						 break;
					}
			  }

			  // Set selected time format
			  const radioButtons = document.querySelectorAll('input[name="time_format"]');
			  for (const radio of radioButtons) {
					if (timeFormatValue && radio.value === timeFormatValue) {
						 radio.checked = true;
					}
			  }
		 }
	} catch (err) {
		 await errorLogs('populateDateTimeFormError', 'Populate Date Time Form Error:', err);
	}
}
