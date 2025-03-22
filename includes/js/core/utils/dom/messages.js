import { getValidElement } from './elements.js';

/**
 * Safely displays a message with fallback handling
 * @param {Object} options Message display options
 * @param {string} options.elementId Element ID to display message in
 * @param {string} options.message Message to display
 * @param {boolean} [options.isSuccess=false] If true, shows as success message
 * @param {string} [options.color='w3-text-green'] CSS class for success color
 * @returns {<void>}
 */
export function safeDisplayMessage({
    elementId,
    message,
    isSuccess = false,
    color = 'w3-text-green',
    targetId = null,
}) {
    try {
        if (isSuccess) {
            mySuccess(elementId, message, color);
        }
        else {
            myError(elementId, message, targetId);
        }
    }
    catch (err) {
        // Fail-safe display without throwing
        displayErrorMessage(elementId, message);
    }
}

/**
 * Regular error display for normal application use
 * @param {HTMLElement|string} ele - Element or ID to display error
 * @param {string} msg - Error message to display
 * @param {HTMLElement|string|null} [target=null] - Optional target for error styling
 */
export function myError(ele, msg, target = null) {
    try {
        const element = getValidElement(ele);
        removeTextColorClasses(element);
        element.classList.add('w3-text-red');

        if (!isMessageContainer(element)) {
            element.classList.add('error');
        }

        element.innerHTML = msg;
        element.classList.remove('w3-hide');

        if (target) {
            handleTargetStyling(target);
        }
    }
    catch (err) {
        import('../../errors/models/AppError.js')
            .then(({ AppError }) => {
                throw new AppError('Display error failed', {
                    originalError: err,
                    errorCode: AppError.Types.RENDER_ERROR,
                    userMessage: AppError.BaseMessages.system.generic,
                    displayTarget: 'page-msg'
                });
            });
    }
}

/**
 * Displays a success message with custom styling
 * @param {HTMLElement|string} ele - Element or ID to display message
 * @param {string} msg - Success message to display
 * @param {string} [color='w3-text-green'] - CSS class for text color
 */
export function mySuccess(ele, msg, color = 'w3-text-green') {
    try {
        const element = getValidElement(ele);

        // Remove any existing text colors
        removeTextColorClasses(element);
        element.classList.add(color);

        // Remove error class if present
        element.classList.remove('error');

        // Set message and ensure visibility
        element.innerHTML = msg;
        element.classList.remove('w3-hide');
    }
    catch (err) {
        import('../../errors/models/AppError.js')
            .then(({ AppError }) => {
                throw new AppError('Success message display failed', {
                    originalError: err,
                    errorCode: AppError.Types.RENDER_ERROR,
                    userMessage: AppError.BaseMessages.system.generic,
                    displayTarget: 'page-msg',
                    shouldLog: false  // Don't log UI feedback issues
                });
            });
    }
}

/**
 * Fail-safe error message display for error handler
 * @param {string} targetId - Element ID for error display
 * @param {string} message - Error message to display
 */
export function displayErrorMessage(targetId, message) {
    try {
        const element = document.getElementById(targetId);
        if (element) {
            element.textContent = message;
            element.classList.remove('w3-hide');
            element.classList.add('w3-text-red');
        }
        else {
            console.error(`Error display element not found: ${targetId}`);
        }
    }
    catch (err) {
        console.error('Critical error in error display:', err);
    }
}

/**
 * Clears message display and resets styling
 * @param {Object} params Clear message configuration
 * @param {HTMLElement|string} params.container Container element or ID
 * @param {boolean} [params.hide=false] Whether to hide container after clearing
 * @param {HTMLElement|string} [params.input=null] Input element to remove error styling
 */
export function clearMsg({ container, hide = false, input = null }) {
    try {
        const element = getValidElement(container);

        // Remove any text color classes
        removeTextColorClasses(element);

        // Clear content and error state
        element.classList.remove('error');
        element.innerHTML = '';

        if (hide) {
            element.classList.add('w3-hide');
        }

        if (input) {
            const inputElement = getValidElement(input);
            inputElement.classList.remove('w3-border-error');
        }
    }
    catch (err) {
        import('../../errors/models/AppError.js')
            .then(({ AppError }) => {
                throw new AppError('Failed to clear message', {
                    originalError: err,
                    errorCode: AppError.Types.RENDER_ERROR,
                    userMessage: AppError.BaseMessages.system.generic,
                    displayTarget: 'page-msg',
                    shouldLog: true
                });
            });
    }
}

/**
 * Removes all text color classes from element
 */
function removeTextColorClasses(element) {
    for (let i = element.classList.length - 1; i >= 0; i--) {
        const className = element.classList[i];
        if (className.startsWith('w3-text-')) {
            element.classList.remove(className);
        }
    }
}

/**
 * Checks if element is a message container
 */
function isMessageContainer(element) {
    return ['form-msg', 'page-msg', 'modal-msg'].includes(element.id);
}

/**
 * Handles error styling for target element
 * @throws {Error} If target is invalid
 */
function handleTargetStyling(target) {
    const targetElement = getValidElement(target);
    targetElement.classList.add('w3-border-error');
}

