import { AppError } from '../models/AppError.js';
import { displayErrorMessage, safeDisplayMessage } from '../../utils/dom/messages.js';
import { errorLogs } from './errorLogs.js';

/**
 * Handles application errors with logging and user feedback
 * @param {Error|AppError} error - Error to handle
 * @param {boolean} [shouldRethrow=false] - Whether to rethrow after handling
 */
export async function handleError(error, shouldRethrow = false) {
    // Ensure error is an AppError
    const appError = error instanceof AppError ? error :
        new AppError('An error occurred', {
            originalError: error,
            errorCode: 'UNKNOWN_ERROR'
        });

    try {
        // Only log if hasn't been logged
        if (appError.shouldLog && !appError.logged) {
            await errorLogs(
                appError.errorCode || 'UNKNOWN',
                appError.message,
                appError.originalError || appError
            );
            appError.logged = true;
        }

        // Use fail-safe error display
        safeDisplayMessage({
            elementId: appError.displayTarget,
            message: appError.userMessage,
            isSuccess: false
        });

        if (shouldRethrow) {
            throw appError;
        }
    }
    catch (handlingError) {
        // Last resort error handling
        console.error('Error handling failed:', handlingError);
        displayErrorMessage('page-msg', 'A system error occurred. Please try refreshing the page.');
    }
}
