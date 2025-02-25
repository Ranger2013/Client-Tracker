import { AppError } from './AppError.js';

export async function handleError(error) {
    // Ensure error is an AppError
    const appError = error instanceof AppError ? error : 
        new AppError('An error occurred', { 
            originalError: error,
            errorCode: 'UNKNOWN_ERROR'
        });

    try {
        // Only log if hasn't been logged
        if (appError.shouldLog && !appError.logged) {
            console.error(`${appError.errorCode}: ${appError.message}`, appError.originalError);
            appError.logged = true;
        }

        // Display user message in appropriate target
        const target = document.getElementById(appError.displayTarget);
        if (target) {
            target.textContent = appError.userMessage;
            target.classList.remove('w3-hide');
        }

        // Rethrow for parent handlers
        throw appError;
    } catch (handlingError) {
        // Last resort error handling
        console.error('Error handling failed:', handlingError);
        const pageMsg = document.getElementById('page-msg');
        if (pageMsg) {
            pageMsg.textContent = 'A system error occurred. Please try refreshing the page.';
            pageMsg.classList.remove('w3-hide');
        }
    }
}
