import { addListener } from '../../../../../../../core/utils/dom/listeners';
import { safeDisplayMessage } from '../../../../../../../core/utils/dom/messages';

// Setup debug mode
const COMPONENT = 'Monthly Projections Page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function monthlyProjections({ tabContentContainer, componentId, manageUser }) {
	try{
		const eventListeners = {
			'change:month': async (evt) => {
				safeDisplayMessage({
					elementId: 'projection-form-msg',
					message: 'Processing...',
					isSuccess: true,
					color: 'w3-text-blue',
				});

				const { default: buildMonthlyProjection } = await import("./components/buildMonthlyProjection.js");
				return await buildMonthlyProjection(evt);
			},
		};

		addListener({
			elementOrId: 'month',
			eventType: ['change'],
			handler: async (evt) => {
				const keyPath = `${evt.type}:${evt.target.id}`;

				if(eventListeners[keyPath]){
					await eventListeners[keyPath](evt);
				}
			},
			componentId,
		});
	}
	catch(err){
		const { AppError } = await import("../../../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
			displayTarget: 'form-msg',
		});
	}
}