import ManageUser from "../../../classes/ManageUser.js";
import setupBackupNotice from "../../../utils/backup-notice/backupNotice.js";
import { myError, mySuccess, top } from "../../../utils/dom/domUtils.js";
import { addListener } from "../../../utils/event-listeners/listeners.js";
import displayMultipleInputs from "./helpers/displayMultipleInputs.js";
import makeInputsGreen from "./helpers/makeInputsGreen.js";
import populateFarrierPricesForm from "./helpers/populateFarrierPricesForm.js";
import seperateFarrierPricesFromAccessories from "./helpers/seperateFarrierPricesFromAccessories.js";

const COMPONENT_ID = 'farrier-prices';
const manageUser = new ManageUser();

// DOM elements
const farrierPricesForm = document.getElementById('farrier-prices-form');

// Initialize form
setupBackupNotice();
await populateFarrierPricesForm(farrierPricesForm, manageUser);
makeInputsGreen(farrierPricesForm);
displayMultipleInputs(farrierPricesForm);

/**
 * Handles farrier prices form submission
 * @param {SubmitEvent} evt - Form submission event
 * @returns {Promise<void>}
 */
async function handleFormSubmission(evt) {
    evt.preventDefault();
    try {
        mySuccess('form-msg', 'Processing...', 'w3-text-blue');
        top();

        const stores = manageUser.getStoreNames();
        const userData = Object.fromEntries(new FormData(evt.target));
        const farrierPricesStructure = seperateFarrierPricesFromAccessories(userData);

        const updateSuccess = await manageUser.updateLocalUserSettings({
            userData: farrierPricesStructure,
            settingsProperty: 'farrier_prices',
            backupStore: stores.FARRIERPRICES,
            backupAPITag: 'add_farrierPrices'
        });

        if (updateSuccess) {
            mySuccess('form-msg', 'Your pricing has been set.');
        } else {
            myError('form-msg', 'Unable to save pricing at this time.');
        }
    }
    catch (err) {
        const { handleError } = await import("../../../utils/error-messages/handleError.js");
        await handleError({
            filename: 'farrierPricesFormError',
            consoleMsg: 'Farrier prices form submission error: ',
            err,
            userMsg: 'Unable to save pricing',
            errorEle: 'form-msg'
        });
    }
}

// Initialize form submission handler
addListener(farrierPricesForm, 'submit', handleFormSubmission, COMPONENT_ID);