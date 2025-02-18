import { clearMsg, myError, mySuccess, disableEnableSubmitButton } from "../../../utils/dom/domUtils.js";
import { addListener } from "../../../utils/event-listeners/listeners.js";
import { createDebouncedHandler, getOptimalDelay } from "../../../utils/event-listeners/eventUtils.js";
import handleDuplicateClientFormSubmission from "./helpers/handleDuplicateClientFormSubmission.js";

const COMPONENT_ID = 'duplicate-client-component';
const FORM_MSG = 'form-msg';

/**
 * Initializes duplicate client functionality
 * @param {Object} params - Configuration parameters
 * @param {HTMLElement} params.clientContainer - Container for client elements
 * @returns {Promise<Function>} Cleanup function to remove event listeners
 */
export default async function duplicateClient({ clientContainer }) {
    try {
        const elements = {
            filter: document.getElementById('filter-client'),
            select: document.getElementById('duplicate-client'),
            submit: document.getElementById('submit-button')
        };

        elements.submit.disabled = true;

        const originalOptions = Array.from(elements.select.options)
            .map(option => ({
                value: option.value,
                text: option.text
            }));

        setupEventListeners(elements, originalOptions, clientContainer);
        return () => removeListeners(COMPONENT_ID);

    } catch (err) {
        const { handleError } = await import("../../../utils/error-messages/handleError.js");
        await handleError('duplicateClientError', 'Error initializing duplicate client:', err);
    }
}

/**
 * Sets up event listeners for the duplicate client form
 * @param {Object} elements - Form elements
 * @param {HTMLInputElement} elements.filter - Filter input element
 * @param {HTMLSelectElement} elements.select - Client select element
 * @param {HTMLButtonElement} elements.submit - Submit button element
 * @param {Array} originalOptions - Original select options
 * @param {HTMLElement} clientContainer - Container for client elements
 */
function setupEventListeners(elements, originalOptions, clientContainer) {
    // Handles the timing of the filter event so it is not called on every button push
    const debouncedFilter = createDebouncedHandler(
        evt => filterSelectElement(evt, elements.select, originalOptions),
        getOptimalDelay('search')
    );

    // Listen for user input to filter names
    addListener(elements.filter, 'input', evt => {
        evt.target.value
            ? mySuccess('form-msg', 'Filtering...', 'w3-text-blue')
            : clearMsg({ container: 'form-msg' });
        debouncedFilter(evt);
    }, COMPONENT_ID);

    // Listen for client selection change
    addListener(elements.select, 'change',
        evt => handleClientSelection(evt, clientContainer, elements.submit),
        COMPONENT_ID
    );

    // Listen for form submission
    addListener('duplicate-form', 'submit', async (evt) => {
        evt.preventDefault();
        handleFormSubmission(evt, clientContainer);
    }, COMPONENT_ID);
}

/**
 * Filters select element options based on input value
 * @param {Event} evt - Input event
 * @param {HTMLSelectElement} selectElement - Select element to filter
 * @param {Array<{value: string, text: string}>} originalOptions - Original select options
 */
function filterSelectElement(evt, selectElement, originalOptions) {
    const [defaultOption, ...rest] = originalOptions;
    const filterValue = evt.target.value.toLowerCase();

    selectElement.innerHTML = '';
    const filteredOptions = [
        defaultOption,
        ...rest.filter(option => option.text.toLowerCase().includes(filterValue))
    ].map(option => Object.assign(
        document.createElement('option'),
        { value: option.value, textContent: option.text }
    ));

    selectElement.append(...filteredOptions);

    if (filterValue) {
        clearMsg({ container: 'form-msg' });
    }
}

/**
 * Handles client selection change
 * @param {Event} evt - Change event
 * @param {HTMLElement} clientContainer - Container for client elements
 * @param {HTMLButtonElement} submitButton - Submit button element
 */
async function handleClientSelection(evt, clientContainer, submitButton) {
    try {
        clearMsg({ container: 'form-msg' });

        if (evt.target.value === 'null') {
            submitButton.disabled = true;
            clientContainer.innerHTML = '';
            return;
        }

        const { default: buildClientSelectElements } = await import('./helpers/buildDuplicateClientElements.js');
        await buildClientSelectElements(evt, clientContainer);
        submitButton.disabled = false;

    } catch (err) {
        const { handleError } = await import("../../../utils/error-messages/handleError.js");
        await handleError('clientSelectError', 'Error handling client selection:', err);
    }
}

/**
 * Validates and handles form submission
 * @param {Event} evt - Submit event
 * @param {HTMLElement} clientContainer - Container for client elements
 */
async function handleFormSubmission(evt, clientContainer) {
    try {
        const trimCycle = document.getElementById('trim-cycle');

        const { default: validateTrimCycle } = await import("../../../utils/validation/helpers/validateTrimCycle.js");
        const isTrimCycleValid = validateTrimCycle(trimCycle);

console.log('isTrimCycleValid', isTrimCycleValid);

        // const response = await handleDuplicateClientFormSubmission(evt);

        // if (response.status === 'success') {
        //     mySuccess('form-msg', response.msg);
        //     evt.target.reset();
        //     clientContainer.innerHTML = '';
        // } else {
        //     myError('form-msg', response.status === 'validation-error'
        //         ? response.msg
        //         : 'Unable to process form submission.'
        //     );
        // }
    }
    catch (err) {
        const { handleError } = await import("../../../utils/error-messages/handleError.js");
        await handleError(
            'handleFormSubmissionError',
            'Error handling form submission',
            err,
            'Unable to process form submission.',
            FORM_MSG);
    }
}

