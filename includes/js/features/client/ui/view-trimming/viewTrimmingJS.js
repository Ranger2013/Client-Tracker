import setupClientAnchorListener from '../../../../core/navigation/components/setupClientAnchorListener';

// Set up debugging.
const COMPONENT = '[View Trimming Dates]';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`${COMPONENT}`, ...args);
	}
};

export default async function viewTrimmingDates({ cID, primaryKey, mainContainer, manageClient, manageUser, componentId }) {
	try{
		// Set the client navigation anchor
		setupClientAnchorListener({
			manageClient,
			manageUser,
			componentId,
		});
	}
	catch(err){
		const { AppError } = await import("../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
		});
	}
}