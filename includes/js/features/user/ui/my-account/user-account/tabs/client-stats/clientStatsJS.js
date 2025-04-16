import selectPage from '../../../../../../../core/navigation/services/selectPage.js';
import { getValidElement } from '../../../../../../../core/utils/dom/elements.js';
import { addListener } from '../../../../../../../core/utils/dom/listeners.js';

// Set up debug mod
const COMPONENT = 'Client Stats Page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

let cleanup = null;

export default async function clientStats({ tabContentContainer, componentId, manageUser, manageClient }) {
	try {
		const dataSetMapping = {
			widget: {
				 values: ['overview', 'horse-types'],
				 useValue: true  // Use the attribute VALUE in keyPath
			},
			horses: {
				 values: true,  // Any value is allowed
				 useValue: false  // Use the attribute NAME in keyPath
			},
			component: {
				 values: ['client-navigation'],
				 useValue: true  // Use the attribute VALUE in keyPath
			},
	  };

		const eventHandlers = {
			'click:overview': (evt) => {
				evt.preventDefault();
				toggleSection({ evt, dataSection: 'horse-types' })
			},
			'click:horse-types': (evt) => {
				evt.preventDefault();
				toggleSection({ evt, dataSection: 'overview' })
			},
			'click:horses': async (evt) => {
				const { default: buildClientsByHorseCount } = await import('../../../../../../../core/layout/user/pages/my-account/client-stats/components/buildClientsByHorseCount.js');
				cleanup = await buildClientsByHorseCount({ evt, tabContentContainer, manageClient });
			},
			'click:client-navigation': async (evt) => {
				evt.preventDefault();
				await selectPage({
					evt,
					page: 'singleClient',
					cID: evt.target.dataset.clientid,
					closeMenu: true,
					primaryKey: evt.target.dataset.primarykey,
					manageUser,
					manageClient,
				})
			},
		};

		addListener({
			elementOrId: 'tab-content-container',
			eventType: ['click'],
			handler: async (evt) => {
				console.log('Clean up: ', cleanup);
				if(cleanup){
					cleanup();
					cleanup = null;
				}

				try {
					// Find the first matching data attribute and its value
					let matchKey = null;
					let matchValue = null;
					let useValue = false;

					// Check each data attribute defined in our mapping
					for (const [attrName, config] of Object.entries(dataSetMapping)) {
						// If element has this data attribute
						if (evt.target.dataset[attrName] !== undefined) {
							const attrValue = evt.target.dataset[attrName];
							const allowedValues = config.values;

							// If any value is allowed or this value is in the allowed list
							if (allowedValues === true ||
								(Array.isArray(allowedValues) && allowedValues.includes(attrValue))) {
								matchKey = attrName;
								matchValue = attrValue;
								useValue = config.useValue;
								break;
							}
						}
					}

					if (matchKey) {
						// Dynamically determine whether to use attribute name or value
						const eventValue = useValue ? matchValue : matchKey;
						const keyPath = `${evt.type}:${eventValue}`;

						if (eventHandlers[keyPath]) {
							await eventHandlers[keyPath](evt);
						}
					}
				}
				catch (err) {
					const { AppError } = await import("../../../../../../../core/errors/models/AppError.js");
					AppError.handleError(err, {
						errorCode: AppError.Types.INITIALIZATION_ERROR,
						userMessage: AppError.BaseMessages.system.initialization,
						displayTarget: 'form-msg',
					});
				}
			},
			componentId,
		})
	}
	catch (err) {
		const { AppError } = await import("../../../../../../../core/errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: AppError.BaseMessages.system.initialization,
			displayTarget: 'form-msg',
		});
	}
}

function toggleSection({ evt, dataSection }) {
	// The data set string
	const widgetString = evt.target.dataset.widget;

	// Get valid elements
	const widget = document.querySelector(`[data-widget="${widgetString}"]`);
	const otherWidget = document.querySelector(`[data-widget="${dataSection}"]`);

	// Get the container sections
	const widgetSection = getValidElement(`${widgetString}-container`);
	const closeSection = getValidElement(`${dataSection}-container`);

	// Add or remove the w3-blue-grey class
	widget.classList.add('w3-blue-grey');
	otherWidget.classList.remove('w3-blue-grey');

	// Toggle the visibility of the sections
	widgetSection.classList.remove('w3-hide');
	closeSection.classList.add('w3-hide');
}