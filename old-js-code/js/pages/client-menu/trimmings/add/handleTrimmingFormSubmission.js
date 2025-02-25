import ManageTrimming from "../../../../classes/ManageTrimming.js";
import { disableEnableSubmitButton } from "../../../../utils/dom/domUtils.js";
import { helpDeskTicket } from "../../../../utils/error-messages/errorMessages.js";
import validateTrimmingForm from "../../../../utils/validation/validateTrimmingForm.js";

// Helper to process form data with multiple selections
const processFormData = (formData) => {
    const entries = Array.from(formData.entries());
    
    const processed = entries.reduce((acc, [key, value]) => {
        // Handle number-horses field
        if (key === 'number-horses') {
            acc.number_horses = value;
        }
        // Handle horse list selections
        else if (key.startsWith('horse-list-')) {
            acc[key] = value || 'null';  // Ensure null is a string to match validation
        }
        // Handle multiple selections (accessories)
        else if (key.startsWith('accessories_')) {
            acc[key] = acc[key] || [];
            if (value.trim()) {
                acc[key].push(value);
            }
        } 
        // Handle all other fields
        else if (value.trim() || value === '0') {
            acc[key] = value;
        }
        return acc;
    }, {});

    return processed;
};

export default async function handleTrimmingFormSubmission(evt, clientInfo) {
    try {
        // Process form data with multiple selections support
        const userData = processFormData(new FormData(evt.target));

        // Validate the form
        const validationError = await validateTrimmingForm(userData);
        if (validationError) {
            await disableEnableSubmitButton('submit-button');
            return { 
                status: 'validation-error', 
                msg: 'Please correct the errors in the form.' 
            };
        }

        // Add client info and process trimming
        const trimmingData = {
            ...userData,
            primaryKey: clientInfo.primaryKey
        };

        const manageTrimming = new ManageTrimming();
        const response = await manageTrimming.handleAddTrimmingSession(trimmingData, clientInfo);
        
        // Ensure we're returning the complete response object
        return response;

    } catch (err) {
        const { handleError } = await import("../../../../utils/error-messages/handleError.js");
        await handleError(
            'addTrimmingError',
            'Add trimming error: ',
            err,
            'We encountered an error. Unable to add trimming/shoeing at this time.',
            'form-msg'
        );

        return { 
            status: 'error', 
            msg: `Unable to add trimming at this time.<br>${helpDeskTicket}.` 
        };
    }
}