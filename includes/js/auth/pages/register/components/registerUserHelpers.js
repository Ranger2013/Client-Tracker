import { authAPI } from "../../../../core/network/api/apiEndpoints.min.js";
import { fetchData } from "../../../../core/network/services/network.min.js";
import { clearMsg, safeDisplayMessage } from "../../../../core/utils/dom/messages.min.js";
import { top } from "../../../../core/utils/window/scroll.min.js";

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
        const [{default: openModal}, { AppError }] = await Promise.all([
            import("../../../../core/services/modal/openModal.js"),
            import("../../../../core/errors/models/AppError.js")
        ]);

        openModal({ 
            content: `
                <div class="w3-container w3-center">
                    <h4 class="w3-text-red">Error</h4>
                    <p>Unable to load content. Please try again later.</p>
                </div>
            `
        });

        AppError.handleError(err, {
            errorCode: AppError.Types.RENDER_ERROR,
            userMessage: AppError.BaseMessages.system.render,
        });
    }
}

export async function handleUserRegistration(evt) {
    evt.preventDefault();
    const formContainer = document.getElementById('form-container');

    try {
        safeDisplayMessage({
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

            safeDisplayMessage({
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
            safeDisplayMessage({
                elementId: 'form-msg',
                message: req.msg,
            });
        }
        else {
            safeDisplayMessage({
                elementId: 'form-msg',
                message: 'Uknown Error. Please try again later.',
            });
        }
    }
    catch (err) {
        const { AppError } = await import("../../../../core/errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
            userMessage: 'Unable to complete registration. Please try again later.',
            displayTarget: 'form-msg',
        });
    }
}