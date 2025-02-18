import { clearMsg, disableEnableSubmitButton, myError } from "../dom/domUtils.js";
import { addListener } from "../event-listeners/listeners.js";
import { underscoreToHyphen, hyphenToUnderscore } from "../string/stringUtils.js";

export default async function validateTrimmingForm(userData) {
    try {
        // Check if number_horses exists and is valid
        if (!userData.number_horses || userData.number_horses === '0') {
            myError('number-horses-error', 'Number of horses cannot be 0 or empty', 'number-horses');
            addListener('number-horses', 'focus', handleInputFocus, 'formValidation');
            return true;
        }

        // Get all horse list selections using underscore pattern for form field names
        const horseSelections = Object.entries(userData)
            .filter(([key]) => key.startsWith('horse_list_'))
            .map(([key, value]) => ({ key, value }));
        
        // If no horses were selected at all
        if (horseSelections.length === 0) {
            myError('form-msg', 'Please select at least one horse');
            return true;
        }

        // Check if we have the expected number of horses
        if (horseSelections.length !== Number(userData.number_horses)) {
            myError('form-msg', `Expected ${userData.number_horses} horse selections but found ${horseSelections.length}`);
            return true;
        }

        // Check for invalid selections using null string comparison
        const invalidSelections = horseSelections.filter(({ value }) => value === 'null' || !value);
        if (invalidSelections.length > 0) {
            invalidSelections.forEach(({ key }) => {
                const selectId = underscoreToHyphen(key); // Use utility function
                const select = document.getElementById(selectId);
                if (select) {
                    myError(`${selectId}-error`, 'Please select a horse', select);
                    addListener(select, 'focus', handleInputFocus, 'formValidation');
                }
            });
            return true;
        }

        return false;
    } catch (err) {
        const { handleError } = await import("../error-messages/handleError.js");
        await handleError(
            'validateTrimmingFormError',
            'Validate trimming form error: ',
            err,
        );
        return false;
    }
}

// Handler for input focus events
function handleInputFocus(evt) {
    const errorContainer = `${evt.target.id}-error`;
    clearMsg({ 
        container: errorContainer,
        hide: true, 
        input: evt.target 
    });
    disableEnableSubmitButton('submit-button');
}