import openModal from '../../../../core/services/modal/openModal.js';
import { getValidElement } from '../../../../core/utils/dom/elements.js';
import { addListener } from '../../../../core/utils/dom/listeners.js';
import { safeDisplayMessage } from "../../../../core/utils/dom/messages.js";
import { top } from "../../../../core/utils/window/scroll.js";
import ManageUser from "../../models/ManageUser.js";
import displayMultipleInputs from "./components/farrier-prices/displayMultipleInputs.js";
import makeInputsGreen from "./components/farrier-prices/makeInputsGreen.js";
import populateFarrierPricesForm from "./components/farrier-prices/populateFarrierPricesForm.js";
import seperateFarrierPricesFromAccessories from './components/farrier-prices/seperateFarrierPricesFromAccessories.js';

// Set up debug mode
const COMPONENT = 'Farrier Prices';
const DEBUG = false;
const debugLog = (...args) => {
    if (DEBUG) {
        console.log(COMPONENT, ...args);
    }
};

const COMPONENT_ID = 'farrier-prices';
const FARRIER_PRICES_FORM = 'farrier-prices-form';

const manageUser = new ManageUser();

async function init() {
    // Initialize form
    await Promise.all([
        populateFarrierPricesForm({ form: FARRIER_PRICES_FORM, manageUser, componentId: COMPONENT_ID }),
        displayMultipleInputs(FARRIER_PRICES_FORM, COMPONENT_ID),
        makeInputsGreen({ form: FARRIER_PRICES_FORM, componentId: COMPONENT_ID }),
    ]);

    // Set up the static listeners
    const staticEventHandlers = {
        'click:info-icon': (evt) => {
            showTrimmingInfoInModal({ iconId: 'trimming-help-info', title: 'Trimming Pricing Information' });
        },
        'click:accessory-info-icon': (evt) => {
            showTrimmingInfoInModal({ iconId: 'accessory-help-info', title: 'Accessory Pricing Information' });
        },
        'submit:farrier-prices-form': async (evt) => {
            evt.preventDefault();
            handleFormSubmission(evt);
        }
    };


    // Initialize form submission handler
    addListener({
        elementOrId: FARRIER_PRICES_FORM,
        eventType: ['click', 'submit'],
        handler: (evt) => {
            debugLog('evt.target: ', evt.target);
            const keyPath = `${evt.type}:${evt.target.id}` || `${evt.type}:${evt.target.parentElement.id}`;
            debugLog('keyPath', keyPath);

            if (staticEventHandlers[keyPath]) {
                staticEventHandlers[keyPath](evt);
            }
        },
        componentId: COMPONENT_ID
    });

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
            debugLog('userData', userData);

            const farrierPricesStructure = await seperateFarrierPricesFromAccessories(userData);

            debugLog('farrierPricesStructure', farrierPricesStructure);
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

}

function showTrimmingInfoInModal({ iconId, title }) {
    const informationContent = getValidElement(iconId);
    const content = informationContent.innerHTML;

    debugLog('informationContent', informationContent);
    openModal({
        title: title,
        content,
        configuration: [
            'w3-padding',
            'w3-round-large',
            'w3-white',
            'w3-margin',
            'w3-margin-center'
        ],
    });
}

init();


