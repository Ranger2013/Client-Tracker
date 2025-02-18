import checkAppointment from "../../../../utils/appointment-block/checkAppointment.js";
import { clearMsg, disableEnableSubmitButton, myError, mySuccess, top } from "../../../../utils/dom/domUtils.js";
import { addListener, removeListeners } from "../../../../utils/event-listeners/listeners.js";
import showListOfHorses from "./helpers/showListOfHorses.js";
import { updateAllSelectElements } from "./helpers/updateHorseListSelectElements.js";

export default async function addTrimming({ clientInfo }) {
    try {
        // Cache frequently used DOM elements
        const elements = {
            form: document.getElementById('trimming-form'),
            numberHorses: document.getElementById('number-horses'),
            horseContainer: document.getElementById('number-horse-container'),
            nextTrimDate: document.getElementById('next-trim-date'),
            appointmentBlock: document.getElementById('appointment-block'),
            projectedBlock: document.getElementById('projected-appointment-block'),
            submitButton: document.getElementById('submit-button')
        };

        // Initial appointment check
        checkAppointment({
            trimDate: 'next-trim-date',
            appBlock: 'appointment-block',
            projAppBlock: 'projected-appointment-block',
            clientInfo,
        });

        // Use event delegation for horse list selects
        elements.horseContainer.addEventListener('change', async (evt) => {
            if (evt.target.matches('select[id^="horse-list-"]')) {
                await updateAllSelectElements(evt);
            }
        });

        // Number of horses input handler
        const numberHorsesHandler = async (evt) => {
            try {
                if (evt.target.value === '0' || evt.target.value === '') {
                    myError('number-horses-error', 'Number of horses cannot be 0 or empty', 'number-horses');
                    await disableEnableSubmitButton('submit-button');
                    return;
                }

                await showListOfHorses({ 
                    evt, 
                    horseListContainer: elements.horseContainer, 
                    primaryKey: clientInfo.primaryKey 
                });

                // Initialize previous values for all select elements
                document.querySelectorAll('select[id^="horse-list-"]')
                    .forEach(select => select.dataset.previousValue = select.value);
            }
				catch (err) {
                const { handleError } = await import("../../../../utils/error-messages/handleError.js");
                await handleError(
                    'numberHorsesInputError',
                    'Number horses Input error: ',
                    err,
                    'We encountered an error. Unable to horse selections.',
                    'number-horse-container'
                );
            }
        };

        // Appointment date change handler
        const dateChangeHandler = () => {
            checkAppointment({
                trimDate: 'next-trim-date',
                appBlock: 'appointment-block',
                projAppBlock: 'projected-appointment-block',
                clientInfo,
            });
        };

        // Form submission handler
        const submitHandler = async (evt) => {
            evt.preventDefault();
            top();

            try {
                const { default: handleTrimmingFormSubmission } = await import("./handleTrimmingFormSubmission.js");
                const response = await handleTrimmingFormSubmission(evt, clientInfo);
                
                handleFormSubmissionResponse(response, elements);
            } catch (err) {
                const { handleError } = await import("../../../../utils/error-messages/handleError.js");
                await handleError(
                    'addTrimmingError',
                    'Add trimming error: ',
                    err,
                    'We encountered an error. Unable to add trimming/shoeing at this time.',
                    'form-msg'
                );
            }
        };

        // Add listeners with component ID
        addListener(elements.numberHorses, 'input', numberHorsesHandler, 'addTrimming');
        addListener(elements.nextTrimDate, 'change', dateChangeHandler, 'addTrimming');
        addListener(elements.form, 'submit', submitHandler, 'addTrimming');
        
        // Cleanup function
        return () => removeListeners('addTrimming');

    } catch (err) {
        const { handleError } = await import("../../../../utils/error-messages/handleError.js");
        await handleError(
            'buildAddTrimmingPageError',
            'Build add trimming page error: ',
            err,
            'We encountered an error. Unable to add trimming/shoeing at this time.',
            'form-msg'
        );
    }
}

// Helper function to handle form submission response
function handleFormSubmissionResponse(response, elements) {
    // Clear any existing messages
    clearMsg({ container: 'form-msg' });
    
    if (response?.status === 'success') {
        // Build complete message with both success and receipt info
        const successMsg = [response.msg];
        
        // Only add receipt message if it's not empty
        if (response.receipt_msg) {
            successMsg.push(response.receipt_msg);
        }
        
        // Display the combined message
        mySuccess('form-msg', successMsg.join(' '));
        
        // Reset form
        elements.horseContainer.innerHTML = '';
        elements.form.reset();
    } else {
        myError('form-msg', response?.msg || 'An error occurred while processing the form.');
    }
}