import { cleanUserOutput } from "../../../../../../core/utils/string/stringUtils.js";

/**
 * Checks for and populates form with local IDB data if it exists.
 * If no local data exists, keeps server-rendered values.
 */
export default async function populateDateTimeForm(manageUser, domElements) {
    const { timeZone, dateFormat } = domElements;

    try {
        // Get local date time options
        const dateTime = await manageUser.getDateTimeOptions();

        // If no local data, keep server-rendered values
        if (!dateTime) return;

        // Ensure we have all required values before overwriting server data
        if (!dateTime.date_format || !dateTime.time_format || !dateTime.time_zone) return;

        // We have valid local data - override server values
        timeZone.value = cleanUserOutput(dateTime.time_zone);
        dateFormat.value = cleanUserOutput(dateTime.date_format);

        // Set time format radio
        const timeFormatValue = cleanUserOutput(dateTime.time_format);
        document.querySelector(`input[name="time_format"][value="${timeFormatValue}"]`)
            ?.setAttribute('checked', 'checked');

    } 
    catch (err) {
        const { AppError } = await import("../../../../../../core/errors/models/AppError.js");

        const appError = new AppError('Error while trying to get the user date/time options: ', {
            originalError: err,
            errorCode: AppError.Types.SETTINGS_ERROR,
            userMessage: 'Unable to load date/time settings',
            shouldLog: true,
        });

        await appError.handle();
    }
}
