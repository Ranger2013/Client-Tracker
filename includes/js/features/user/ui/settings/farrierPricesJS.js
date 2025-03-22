import { addListener } from "../../../../core/utils/dom/listeners.min.js";
import { safeDisplayMessage } from "../../../../core/utils/dom/messages.min.js";
import { top } from "../../../../core/utils/window/scroll.min.js";
import ManageUser from "../../models/ManageUser.min.js";
import displayMultipleInputs from "./components/farrier-prices/displayMultipleInputs.min.js";
import makeInputsGreen from "./components/farrier-prices/makeInputsGreen.min.js";
import populateFarrierPricesForm from "./components/farrier-prices/populateFarrierPricesForm.min.js";
import seperateFarrierPricesFromAccessories from "./components/farrier-prices/seperateFarrierPricesFromAccessories.min.js";

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
            top();
            safeDisplayMessage({
                elementId: 'form-msg',
                message: 'Your pricing has been set.',
                isSuccess: true,
            });
        }
    }
    catch (err) {
        const { AppError } = await import("../../../../core/errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
            userMessage: 'Unable to save pricing.',
            displayTarget: 'form-msg',
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
