import { buildElementTree, getValidElement } from '../../../../../../utils/dom/elements';

// Set up debug mode
const COMPONENT = 'Display notifications page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function displayNotificationsPage({ evt, messageContainer, tabContainer, manageUser, componentId }) {
	try {
		tabContainer = getValidElement(tabContainer);
		const pageComponent = buildReminderPage({ tabContainer });

		renderPage({ pageComponent, tabContainer });

		// Initialize slider state after rendering
		await initializeSliderState({ manageUser });
	}
	catch (err) {
		const { AppError } = await import("../../../../../../errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			message: AppError.BaseMessages.system.render,
		});
	}
}

function buildReminderPage({ tabContainer }) {
	const PAGE_MAPPING = {
		type: 'div',
		myClass: ['w3-container'],
		children: {
			titleCenter: {
				type: 'div',
				myClass: ['w3-center'],
				children: {
					title: {
						type: 'h5',
						text: 'Notifications',
					}
				},
			},
			helpContainer: {
				type: 'div',
				myClass: ['w3-container', 'w3-small', 'w3-margin-bottom'],
				text: 'This app does not current send notifications. This is for possible future use.',
			},
			row: {
				type: 'div',
				myClass: ['w3-row'],
				children: {
					colOne: {
						type: 'div',
						myClass: ['w3-col', 's10', 'w3-center'],
						text: 'Turn Notifications On/Off:&nbsp;',
					},
					colTwo: {
						type: 'div',
						myClass: ['w3-col', 's2'],
						children: {
							switchLabel: {
								type: 'label',
								myClass: ['w3-switch'],
								children: {
									checkbox: {
										type: 'input',
										attributes: { id: 'notification-checkbox', type: 'checkbox' },
									},
									span: {
										type: 'span',
										attributes: { id: 'notification-slider' },
										myClass: ['w3-slider', 'round'],
									},
								},
							},
						},
					},
				},
			},
		},
	};

	const pageComponent = buildElementTree(PAGE_MAPPING);
	return pageComponent;
}

function renderPage({ pageComponent, tabContainer }) {
	tabContainer.innerHTML = ''; // Clear the tab container
	tabContainer.appendChild(pageComponent); // Append the new component
}

async function initializeSliderState({ manageUser }) {
	const userSettingsNotification = await manageUser.getSettings('notifications');
	const { notifications: { status: notificationStatus } } = userSettingsNotification;
	debugLog('notificationStatus: ', notificationStatus);

	const sliderStatus = {
		yes: true,
		no: false,
		default: true
	};

	const checkbox = document.getElementById('notification-checkbox');
	if (checkbox) {
		debugLog('sliderStatus[notificationStatus]: ', sliderStatus[notificationStatus]);
		
		// Only use default if reminderStatus is undefined
		checkbox.checked = sliderStatus[notificationStatus];
			
		debugLog('checkbox.checked: ', checkbox.checked);
	}
}