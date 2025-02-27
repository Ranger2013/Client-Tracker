import { authAPI } from "../../../../core/network/api/apiEndpoints.js";
import { fetchData } from "../../../../core/network/services/network.js";
import { clearMsg, safeDisplayMessage } from "../../../../core/utils/dom/messages.js";
import { top } from "../../../../core/utils/window/scroll.js";

export async function getTerms(type) {
    try {
        const data = await fetchData({ api: authAPI.terms, data: { type } });
        
        // Simple dynamic import when needed
        const { default: openModal } = await import("../../../../core/services/modal/openModal.js");
        
        if (data.message) {
            openModal({ content: data.message });
        } else {
            throw new Error('Unable to load terms content');
        }
    }
    catch (err) {
        const { errorLogs } = await import("../../../../core/errors/services/errorLogs.js");
        await errorLogs('getTermsError', `Error loading ${type}`, err);
        
        const { default: openModal } = await import("../../../../core/services/modal/openModal.js");
        openModal({ 
            content: `
                <div class="w3-container w3-center">
                    <h4 class="w3-text-red">Error</h4>
                    <p>Unable to load content. Please try again later.</p>
                </div>
            `
        });
    }
}

export async function handleUserRegistration(evt) {
    evt.preventDefault();
    const formContainer = document.getElementById('form-container');

    try {
        await safeDisplayMessage({
            elementId: 'form-msg',
            message: 'Registering...',
            color: 'w3-text-blue',
            isSuccess: true,
        });

        const userData = Object.fromEntries(new FormData(evt.target));
        top();

        const req = await fetchData({ api: authAPI.register, data: userData });

        if (req.status === 'ok') {
            // Clear the registering message
            clearMsg({ container: 'form-msg' });

            await safeDisplayMessage({
                elementId: formContainer,
                message: req.msg,
                color: 'w3-text-black',
                isSuccess: true,
            });
        }
        else if (req.status === 'form-errors') {
            const { default: displayFormValidationErrors } = await import("../../../../core/utils/dom/forms/displayFormValidationErrors.js");
            displayFormValidationErrors(req.errors);
        }
        else if (req.status === 'error' || req.status === 'server-error') {
            await safeDisplayMessage({
                elementId: 'form-msg',
                message: req.msg,
            });
        }
        else {
            await safeDisplayMessage({
                elementId: 'form-msg',
                message: 'Uknown Error. Please try again later.',
            });
        }
    }
    catch (err) {
        // Only load error modules if an error occurs
        const [processError, commonErrors] = await Promise.all([
            import("../../../../core/errors/services/errorProcessor.js"),
            import("../../../../core/errors/constants/errorMessages.js")
        ]);

        await processError(err, {
            context: 'registration',
            defaultMessage: 'Unable to complete registration. Please try again later.',
            errorElement: 'form-msg',
            handlers: {
                NetworkError: () => safeDisplayMessage({
                    elementId: 'form-msg',
                    message: commonErrors.networkError
                }),
                AppError: (error) => safeDisplayMessage({
                    elementId: 'form-msg',
                    message: error.userMessage
                })
            }
        });
    }
}