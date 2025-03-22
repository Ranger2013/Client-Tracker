import { AppError } from './AppError.min.js';
import { ErrorTypes } from '../constants/errorTypes.js';

export class AuthorizationError extends AppError {
    constructor(message, details = {}) {
        super(message, {
            errorCode: ErrorTypes.AUTHORIZATION_ERROR,
            userMessage: 'Access denied. Please log in again.',
            ...details
        });
    }
}
