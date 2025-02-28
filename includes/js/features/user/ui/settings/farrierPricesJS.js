import { addListener } from "../../../../core/utils/dom/listeners.js";
import { safeDisplayMessage } from "../../../../core/utils/dom/messages.js";
import { top } from "../../../../core/utils/window/scroll.js";
import ManageUser from "../../models/ManageUser.js";
import displayMultipleInputs from "./components/farrier-prices/displayMultipleInputs.js";
import makeInputsGreen from "./components/farrier-prices/makeInputsGreen.js";
import populateFarrierPricesForm from "./components/farrier-prices/populateFarrierPricesForm.js";
import seperateFarrierPricesFromAccessories from "./components/farrier-prices/seperateFarrierPricesFromAccessories.js";

const COMPONENT_ID = 'farrier-prices';
const manageUser = new ManageUser();

// DOM elements
const farrierPricesForm = document.getElementById('farrier-prices-form');

// Initialize form
await populateFarrierPricesForm({formEle: farrierPricesForm, manageUser});
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
        safeDisplayMessage({
            elementId: 'form-msg',
            message: 'Processing...',
            color: 'w3-text-blue',
            isSuccess: true
        });
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
            safeDisplayMessage({
                elementId: 'form-msg',
                message: 'Your pricing has been set.',
                isSuccess: true,
            });
        } else {
            safeDisplayMessage({
                elementId: 'form-msg',
                message: 'We were unable to save your pricing.',
            });
        }
    }
    catch (err) {
        const { handleError } = await import("../../../../../../old-js-code/js/utils/error-messages/handleError.js");
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