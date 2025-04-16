import { TransferDataManager } from '../../../../../models/TransferDataManager.js';

// Setup debug mode
const COMPONENT = 'Transfer Data Page';
const DEBUG = false;
const debugLog = (...args) => {
    if (DEBUG) {
        console.log(`[${COMPONENT}]`, ...args);
    }
};

export default async function transferData({ manageUser }) {
    try {
        const transferManager = new TransferDataManager(manageUser);
        await transferManager.transferData();
    } catch (err) {
        const { AppError } = await import("../../../../../../../core/errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.PROCESSING_ERROR,
            message: AppError.BaseMessages.system.processing,
        });
    }
}