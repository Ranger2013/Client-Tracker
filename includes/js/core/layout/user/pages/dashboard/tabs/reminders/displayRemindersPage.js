import { buildElementTree, getValidElement } from '../../../../../../utils/dom/elements.js';

// Set up debug mode
const COMPONENT = 'Display reminders page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function displayRemindersPage({ evt, messageContainer, tabContainer, manageUser, componentId }) {
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
						text: 'Reminders',
					}
				},
			},
			helpContainer: {
				type: 'div',
				myClass: ['w3-container', 'w3-small', 'w3-margin-bottom'],
				text: 'Reminders will show or hide the backup data banner on the pages.',
			},
			row: {
				type: 'div',
				myClass: ['w3-row'],
				children: {
					colOne: {
						type: 'div',
						myClass: ['w3-col', 's10', 'w3-center'],
						text: 'Turn Reminders On/Off:&nbsp;',
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
										attributes: { id: 'reminder-checkbox', type: 'checkbox' },
									},
									span: {
										type: 'span',
										attributes: { id: 'reminder-slider' },
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
	const userSettingsReminder = await manageUser.getSettings('reminders');
	const { reminders: { status: reminderStatus } } = userSettingsReminder;
	debugLog('reminderStatus: ', reminderStatus);

	const sliderStatus = {
		yes: true,
		no: false,
		default: true
	};

	const checkbox = document.getElementById('reminder-checkbox');
	if (checkbox) {
		debugLog('sliderStatus[reminderStatus]: ', sliderStatus[reminderStatus]);
		
		// Only use default if reminderStatus is undefined
		checkbox.checked = sliderStatus[reminderStatus];
			
		debugLog('checkbox.checked: ', checkbox.checked);
	}
}