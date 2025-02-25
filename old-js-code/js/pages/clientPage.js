import { dom } from '../core/utils/dom.js';
import { clientList } from '../features/clients/clientList.js';
import { AppError, ErrorTypes } from '../core/errors.js';

export async function buildClientPage(config) {
    try {
        const container = dom.create({ type: 'div', class: 'container' });
        await clientList.build(config);
        // More streamlined, error-handled composition
    } catch (error) {
        throw new AppError('Failed to build client page', {
            errorCode: ErrorTypes.PAGE_LOAD_ERROR,
            originalError: error
        });
    }
}
