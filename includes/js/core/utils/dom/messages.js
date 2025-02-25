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
 * Regular error display for normal application use
 * @param {HTMLElement|string} ele - Element or ID to display error
 * @param {string} msg - Error message to display
 * @param {HTMLElement|string|null} [target=null] - Optional target for error styling
 */
export async function myError(ele, msg, target = null) {
	try {
		const element = getValidElement(ele);

		// Handle text color classes
		removeTextColorClasses(element);
		element.classList.add('w3-text-red');

		// Add error class if not a message container
		if (!isMessageContainer(element)) {
			element.classList.add('error');
		}

		// Set message and ensure visibility
		element.innerHTML = msg;
		element.classList.remove('w3-hide');

		// Handle target if provided
		if (target) {
			handleTargetStyling(target);
		}
	}
	catch (err) {
		// Only throw when there's an actual display problem
		const { AppError } = await import('../../errors/models/AppError.js');
		const { ErrorTypes } = await import('../../errors/constants/errorTypes.js');

		throw new AppError('Failed to display error message', {
			errorCode: ErrorTypes.RENDER_ERROR,
			userMessage: 'Unable to display error message',
			originalError: err,
			displayTarget: 'page-msg'
		});
	}
}

/**
 * Displays a success message with custom styling
 * @param {HTMLElement|string} ele - Element or ID to display message
 * @param {string} msg - Success message to display
 * @param {string} [color='w3-text-green'] - CSS class for text color
 */
export async function mySuccess(ele, msg, color = 'w3-text-green') {
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
        const { AppError } = await import('../../errors/models/AppError.js');
        const { ErrorTypes } = await import('../../errors/constants/errorTypes.js');
        
        throw new AppError('Failed to display status message', {
            errorCode: ErrorTypes.RENDER_ERROR,
            userMessage: 'Unable to display status update',
            originalError: err,
            displayTarget: 'page-msg',
            shouldLog: false  // Don't log UI feedback issues
        });
    }
}

/**
 * Safely displays a message with fallback handling
 * @param {Object} options Message display options
 * @param {string} options.elementId Element ID to display message in
 * @param {string} options.message Message to display
 * @param {boolean} [options.isSuccess=false] If true, shows as success message
 * @param {string} [options.color='w3-text-green'] CSS class for success color
 */
export async function safeDisplayMessage({ 
    elementId, 
    message, 
    isSuccess = false, 
    color = 'w3-text-green' 
}) {
    try {
        if (isSuccess) {
            await mySuccess(elementId, message, color);
        }
        else {
            await myError(elementId, message);
        }
    }
    catch (displayError) {
        // Fail-safe display without throwing
        displayErrorMessage(elementId, message);
    }
}

/**
 * Clears message display and resets styling
 * @param {Object} params Clear message configuration
 * @param {HTMLElement|string} params.container Container element or ID
 * @param {boolean} [params.hide=false] Whether to hide container after clearing
 * @param {HTMLElement|string} [params.input=null] Input element to remove error styling
 */
export async function clearMsg({ container, hide = false, input = null }) {
    try 
    {
        const element = getValidElement(container);
        
        // Remove any text color classes
        removeTextColorClasses(element);
        
        // Clear content and error state
        element.classList.remove('error');
        element.innerHTML = '';
        
        if (hide) 
        {
            element.classList.add('w3-hide');
        }
        
        if (input) 
        {
            const inputElement = getValidElement(input);
            inputElement.classList.remove('w3-border-error');
        }
    }
    catch (err) 
    {
        const { AppError } = await import('../../errors/models/AppError.js');
        const { ErrorTypes } = await import('../../errors/constants/errorTypes.js');
        
        throw new AppError('Failed to clear message display', {
            errorCode: ErrorTypes.RENDER_ERROR,
            userMessage: 'Unable to clear message',
            originalError: err,
            displayTarget: 'page-msg',
            shouldLog: false
        });
    }
}

/**
 * Gets element by ID or validates HTMLElement
 * @throws {Error} If element is invalid or not found
 */
function getValidElement(element) {
	if (typeof element === 'string') {
		const ele = document.getElementById(element);
		if (!ele) {
			throw new Error(`Element with ID "${element}" not found.`);
		}
		return ele;
	}

	if (!(element instanceof HTMLElement)) {
		throw new Error('The provided element is not valid.');
	}

	return element;
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

