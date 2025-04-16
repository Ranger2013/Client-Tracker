import { buildEle, buildElementTree, buildGenericSelectOptions, getValidElement } from '../../../../../utils/dom/elements.js';
import { removeListeners } from '../../../../../utils/dom/listeners';
import displayRemindersPage from '../../dashboard/tabs/reminders/displayRemindersPage.js';

// Set up debug mode
const COMPONENT = 'Monthly Projections Page';
const DEBUG = true;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

const COMPONENT_ID = 'build-monthly-projections-page';

export default async function buildMonthlyProjectionsPage({ tabContentContainer, manageUser }) {
	try {
		const pageComponents = buildPageComponents();

		renderPage({ tabContainer: tabContentContainer, pageComponents });

		await initializeUI({ tabContentContainer, manageUser, componentId: COMPONENT_ID });

		return () => removeListeners(COMPONENT_ID);
	}
	catch (err) {
		const { AppError } = await import("../../../../../errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: AppError.BaseMessages.system.render,
			displayTarget: 'form-msg',
		}, true);
	}
}

function getMonths() {
	return [
		{ value: 'null', text: '-- Select a month --' },
		{ value: 1, text: 'January' },
		{ value: 2, text: 'February' },
		{ value: 3, text: 'March' },
		{ value: 4, text: 'April' },
		{ value: 5, text: 'May' },
		{ value: 6, text: 'June' },
		{ value: 7, text: 'July' },
		{ value: 8, text: 'August' },
		{ value: 9, text: 'September' },
		{ value: 10, text: 'October' },
		{ value: 11, text: 'November' },
		{ value: 12, text: 'December' }
	];
}

function buildPageComponents() {
	const PAGE_MAPPING = {
		type: 'div',
		attributes: {
			id: 'select-container',
		},
		myClass: ['w3-padding-small'],
		children: {
			titleContainer: {
				type: 'div',
				myClass: ['w3-center'],
				children: {
					title: {
						type: 'h4',
						text: 'Select a Month',
					}
				},
			},
			projectionFormMsg: {
				type: 'div',
				attributes: {
					id: 'projection-form-msg',
				},
				myClass: ['w3-center'],
			},
			monthSelect: {
				type: 'select',
				attributes: { id: 'month' },
				myClass: ['w3-input', 'w3-border'],
			},
		},
	};

	const components = buildElementTree(PAGE_MAPPING);

	const monthOptions = buildGenericSelectOptions({
		list: getMonths(),
		value: opt => opt.value,
		text: opt => opt.text,
	});

	components.querySelector('#month').append(...monthOptions);

	// Build the projection container
	const projectionContainer = buildEle({
		type: 'div',
		attributes: { id: 'projection-container' },
	});

	components.appendChild(projectionContainer);

	return components;
}

function renderPage({ tabContainer, pageComponents }) {
	// Clear the tab container
	tabContainer = getValidElement(tabContainer);
	tabContainer.innerHTML = '';
	tabContainer.appendChild(pageComponents);
}

async function initializeUI({ tabContentContainer, manageUser, componentId }) {
	const { default: monthlyProjections } = await import("../../../../../../features/user/ui/my-account/user-account/tabs/monthly-projections/monthlyProjectionsJS.js");
	monthlyProjections({tabContentContainer, componentId, manageUser});
}