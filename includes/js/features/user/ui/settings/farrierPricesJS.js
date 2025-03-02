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
await populateFarrierPricesForm({ formEle: farrierPricesForm, manageUser });
displayMultipleInputs(farrierPricesForm, COMPONENT_ID);
makeInputsGreen(farrierPricesForm, COMPONENT_ID);

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
        }
    }
    catch (err) {
        const { AppError } = await import("../../../../core/errors/models/AppError.js");
        new AppError('Error submitting the farrier prices form: ', {
            originalError: err,
            shouldLog: true,
            userMessage: 'Unable to save pricing.',
            errorCode: 'SUBMISSION_ERROR',
            displayTarget: 'form-msg',
            autoHandle: true,
        });
    }
}

// Initialize form submission handler
addListener({
    elementOrId: farrierPricesForm,
    eventType: 'submit',
    handler: handleFormSubmission,
    componentId: COMPONENT_ID
});
