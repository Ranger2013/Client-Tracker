import ManageClient from "../../../../../classes/ManageClient.js";
import { clearMsg, disableEnableSubmitButton, myError, mySuccess } from "../../../../../utils/dom/domUtils.js";
import { ucwords } from "../../../../../utils/string/stringUtils.js";

export async function isDuplicateHorseName(evt, cID, primaryKey) {
    try {
        const manageClient = new ManageClient();
        const clientInfo = await manageClient.getClientInfo({primaryKey});
        const clientHorses = clientInfo?.horses;

        evt.target.value = ucwords(evt.target.value);

        if (!clientHorses || clientHorses?.length === 0) return false;

        return clientHorses.some(horse => 
            horse.horse_name.toLowerCase() === evt.target.value.toLowerCase()
        );
    } catch (err) {
        const { default: errorLogs } = await import("../../../../../../utils/error-messages/errorLogs.js");
        await errorLogs('isDuplicateHorseNameError', 'Is duplicate horse name error: ', err);
        throw err;
    }
}

export async function handleHorseNameInput(evt, cID, primaryKey, componentId) {
    try {
        const horseName = evt.target.value;
        const errorElementId = `${evt.target.id}-error`;

        if (!horseName.trim()) {
            clearMsg({ container: errorElementId, hide: true, input: evt.target });
            return;
        }

        const duplicate = await isDuplicateHorseName(evt, cID, primaryKey);

        if (duplicate) {
            myError(errorElementId, `${horseName} is already listed.`, evt.target.id);
            disableEnableSubmitButton('submit-button', true);
        } else {
            clearMsg({ container: errorElementId, hide: true, input: evt.target });
            disableEnableSubmitButton('submit-button', false);
        }
    } catch (err) {
        const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
        await handleError('isDuplicateHorseNameError', 'Is duplicate horse name error: ', err, 'Unable to validate the horse name.', 'form-msg');
    }
}

export async function handleFormSubmission(evt, cID, primaryKey) {
    try {
        const horseName = evt.target.elements['horse-name'].value;
        const manageClient = new ManageClient();
        
        const result = await manageClient.addNewHorse(horseName, cID, primaryKey);
        
        if (result.status) {
            mySuccess('form-msg', result.msg);
            evt.target.reset();
        } else {
            myError('form-msg', result.msg);
        }
    } catch (err) {
        const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
        await handleError('addHorseFormSubmissionError', 'Add horse form submission error: ', err, 'Unable to add the horse at this time.', 'form-msg');
    }
}

export function createDebouncedHandler(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
