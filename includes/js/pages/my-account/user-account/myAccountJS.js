
// 561 lines of code

import { getValidationToken } from "../../../tracker.js";
import { getSubscriptionAPI, getUnpaidInvoicesAPI } from "../../utils/apiEndpoints.js";
import { addListener } from "../../utils/listeners.js";
import { fetchData } from "../../utils/network.js";
import { buildEle, clearMsg, myError, mySuccess, setActiveTab, top, topOfModal } from "../../utils/utils.js";
import CustomError from "../../classes/CustomerError.js";
import handleSubscriptionRactivationListener from "./helpers/subscriptions/handleSubscriptionRactivationListener.js";
import setupPageTabListeners from "../../../utils/event-listeners/setupPageTabListeners.js";
import noAuthorizationPage from "../../../utils/security/noAuthorizationPage.js";

// Set the DOM Elements
const fm = document.getElementById('form-msg');
const tabContentContainer = document.getElementById('tab-content-container');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
const validationToken = getValidationToken();

// Set up the mapping for the page tabs
// Set the page tabs so we know which page to display
const tabs = {
	subscription: {
		eleId: 'subscriptions-tab',
		action: () => import("../subscription/displaySubscriptionPage.js")
	},
	accountSettings: {
		eleId: 'account-settings-tab',
		action: () => import("../account-settings/displayAccountSettingsPage.js")
	},
	clientStats: {
		eleId: 'client-stats-tab',
		action: () => import("../client-stats/displayClientStatsPage.js")
	},
	monthlyProjections: {
		eleId: 'monthly-projections-tab',
		action: () => import("../monthly-projections/displayMonthlyProjectionSelectElement.js")
	},
	unpaidInvoices: {
		eleId: 'invoices-tab',
		action: () => import("../unpaid-invoices/displayUnpaidInvoices.js")
	}
};

// Set up the paged tabbed listeners
setupPageTabListeners(tabs);


/////////////////////////////////////////////////
///// START FUNCTIONS FOR THE DISPLAY PAGES /////
/////////////////////////////////////////////////
export async function displaySubscriptionPage(evt) {
	try {
		// Clear the content
		tabContentContainer.innerHTML = '';

		// Set the active tab
		setActiveTab(evt, tabs, fm);

		// Build the loading message
		const loading = buildEle({
			type: 'h4',
			attributes: { id: 'loading' },
			myClass: ['w3-center', 'w3-text-blue'],
			text: 'Loading...',
		});

		// Set the loading message to the container
		tabContentContainer.appendChild(loading);

		// Get the subscriptions page
		const req = await fetchData({ api: getSubscriptionAPI, token: validationToken });

		if(req.status === 'auth-error'){
			await noAuthorizationPage();
			return;
		}

		if (req.status === 'ok') {
			// Returns the specific page based on the users member status (i.e. guest or member)
			tabContentContainer.innerHTML = req.msg;

			// The subscription page for the guest user
			if (req.page === 'guest') {
				try {
					// Import
					const { default: handleSubscriptionGuestPage } = await import("./helpers/subscriptions/handleSubscriptionGuestPage.js");
					await handleSubscriptionGuestPage();
				}
				catch (err) {
					console.warn('Error dealing with the guest subscription: ', err);
					myError(fm, 'There was an issue getting you subscribed.<br>Please submit a new Help Desk Ticket for this issue.');
					top();
				}
			}
			// Check if we have the cancel subscription button
			else if (req.page === 'member') {
				try {
					// Imports
					const { default: handleLinkToggles } = await import("./helpers/subscriptions/handleLinkToggles.js");
					const { default: handleSubscriptionUpgradeButtonListeners } = await import("./helpers/subscriptions/handleSubscriptionUpgradeButtonListeners.js");
					const { default: handleSubscriptionCancelationListener } = await import("./helpers/subscriptions/handleSubscriptionCancelationListener.js");
					
					// Handle the link toggles on the page
					handleLinkToggles();

					// Handle the subscription buttons on the page
					handleSubscriptionUpgradeButtonListeners();

					// Handle the cancelation button
					handleSubscriptionCancelationListener(fm);

					// Handle reactivation of subscription
					handleSubscriptionRactivationListener(fm);
				}
				catch (err) {
					console.warn('Error dealing with the member subscription page: ', err);
					myError(fm, err);
					top();
				}
			}
		}
	}
	catch (err) {
		console.warn('error fetching the subscription page from the server: ', err);

		if (err instanceof CustomError) {
			myError(modalMsg);
		}
	}

}

async function displayAccountSettingsPage(evt) {
	// Imports
	const { submitMyAccountForm } = await import('./helpers/myAccountHelpers.js"');
	const { buildPasswordColTwo, toggleColTwoInput } = await import('./helpers/account-settings/accountSettingsHelpers.js"');
	const { buildSubmitButtonSection } = await import("../../utils/helpers/pageBuilderHelpers.js");
	const { getUserInfoAPI } = await import("../../utils/apiEndpoints.js");
	const { fetchData } = await import("../../utils/network.js");


	evt.preventDefault();

	// Set the active tab
	setActiveTab(evt, tabs, fm);

	try {
		const accountContainer = buildEle({
			type: 'div',
			attributes: { id: 'account-container' },
			myClass: ['w3-padding-small']
		});

		const accountMsg = buildEle({
			type: 'div',
			myClass: ['w3-center'],
			attributes: { id: 'account-msg' }
		});

		const accountTitle = buildEle({
			type: 'h6',
			attributes: { style: 'margin-bottom: 0px;' },
			text: 'Account Settings'
		});

		const titleInfo = buildEle({
			type: 'span',
			myClass: ['w3-small', 'w3-italic'],
			text: 'Click on a name to access the form.<br>For your security, any changes made to your credentials will need to be validated from an auto-generated email sent to your email on record.<br>If you do not have access to your old email. Please contact us through the Help Desk and we will update your information.'
		});

		// Start building the form
		const accountForm = buildEle({
			type: 'form',
			attributes: { method: 'post' }
		});

		// Set the event listener for the form submission
		addListener(accountForm, 'submit', submitMyAccountForm);

		// Put it together title info section together
		accountContainer.appendChild(accountMsg);
		accountContainer.appendChild(accountTitle);
		accountContainer.appendChild(titleInfo);
		accountContainer.appendChild(accountForm);

		// Build the username row
		const usernameRow = buildEle({
			type: 'div',
			attributes: { id: 'username-container' },
			myClass: ['w3-row', 'w3-margin-top']
		});


		const usernameColOne = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6', 'w3-padding-small']
		});


		const usernameLabel = buildEle({
			type: 'label',
			attributes: { id: 'username-label', for: 'username' },
			text: 'User Name:'
		});

		// Put the username row together
		accountForm.appendChild(usernameRow);
		usernameRow.appendChild(usernameColOne);
		usernameColOne.appendChild(usernameLabel);

		// Build the password row section
		const passwordRow = buildEle({
			type: 'div',
			attributes: { id: 'password-container' },
			myClass: ['w3-row', 'w3-margin-top'],
		});

		const passwordColOne = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6', 'w3-padding-small']
		});

		const passwordLabel = buildEle({
			type: 'label',
			attributes: {
				id: 'password-label',
				for: 'password'
			},
			text: 'Password:'
		});

		// Put the password row together
		accountForm.appendChild(passwordRow);
		passwordRow.appendChild(passwordColOne);
		passwordColOne.appendChild(passwordLabel);

		// Listen for the password row. This is seperate from the others as it has multiple inputs
		addListener(passwordColOne, 'click', (evt) => buildPasswordColTwo(evt, passwordRow));

		// Build the company row section
		const companyRow = buildEle({
			type: 'div',
			attributes: { id: 'company-container' },
			myClass: ['w3-row', 'w3-margin-top'],
		});

		const companyColOne = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6', 'w3-padding-small']
		});

		const companyLabel = buildEle({
			type: 'label',
			attributes: {
				id: 'company-label',
				for: 'company'
			},
			text: 'Company Name:'
		});

		// Put the company row together
		accountForm.appendChild(companyRow);
		companyRow.appendChild(companyColOne);
		companyColOne.appendChild(companyLabel);

		// Build the phone row section
		const phoneRow = buildEle({
			type: 'div',
			attributes: { id: 'phone-container' },
			myClass: ['w3-row', 'w3-margin-top'],
		});

		const phoneColOne = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6', 'w3-padding-small']
		});

		const phoneLabel = buildEle({
			type: 'label',
			attributes: {
				id: 'phone-label',
				for: 'phone'
			},
			text: 'Phone Number:'
		});

		// Put the phone row together
		accountForm.appendChild(phoneRow);
		phoneRow.appendChild(phoneColOne);
		phoneColOne.appendChild(phoneLabel);

		// Build the email row section
		const emailRow = buildEle({
			type: 'div',
			attributes: { id: 'email-container' },
			myClass: ['w3-row', 'w3-margin-top'],
		});

		const emailColOne = buildEle({
			type: 'div',
			myClass: ['w3-col', 'm6', 'w3-padding-small']
		});

		const emailLabel = buildEle({
			type: 'label',
			attributes: {
				id: 'email-label',
				for: 'email'
			},
			text: 'Email:'
		});

		// Put the email row together
		accountForm.appendChild(emailRow);
		emailRow.appendChild(emailColOne);
		emailColOne.appendChild(emailLabel);

		// Build the submit container
		accountForm.appendChild(buildSubmitButtonSection('Update Credentials', true));

		tabContentContainer.innerHTML = '';
		tabContentContainer.appendChild(accountContainer);

		// First we need to see if we can get the user's information from the server
		let userCredentials = null;
		let username = null;
		let companyName = null;
		let phone = null;
		let email = null;

		try {
			userCredentials = await fetchData({ api: getUserInfoAPI, data: { getUserCredentials: true }, token: validationToken });


			// Set the values for our input elements if we have a good server request
			if (userCredentials && userCredentials.data && Object.keys(userCredentials.data).length > 0) {
				username = userCredentials.data.username;
				companyName = userCredentials.data.company_name;
				phone = userCredentials.data.phone;
				email = userCredentials.data.email;
			}

			const settings = {
				username: {
					params: {
						id: 'username',
						type: 'text',
						name: 'username',
						title: 'User Name',
						autocomplete: 'username',
						required: 'required',
						value: username,
					},
					row: usernameRow,
					colOne: usernameColOne,
				},
				company: {
					params: {
						id: 'company-name',
						type: 'text',
						name: 'company_name',
						title: 'Company Name:',
						autocomplete: 'organization',
						value: companyName,
					},
					row: companyRow,
					colOne: companyColOne,
				},
				phone: {
					params: {
						id: 'phone',
						type: 'text',
						name: 'phone',
						title: 'Phone Number',
						autocomplete: 'tel',
						required: 'required',
						value: phone,
					},
					row: phoneRow,
					colOne: phoneColOne,
				},
				email: {
					params: {
						id: 'email',
						type: 'email',
						name: 'email',
						title: 'Email',
						autocomplete: 'email',
						required: 'required',
						value: email,
					},
					row: emailRow,
					colOne: emailColOne,
				},
			};

			// Loop through the settings to set the event listeners
			for (const listen in settings) {
				const setting = settings[listen];
				addListener(setting.colOne, 'click', (evt) => toggleColTwoInput(evt, setting.row, setting.params));
			}
		}
		catch (err) {
			console.warn('Could not fetch the user\'s account information: ', err);
			myError(fm, 'Unable to get data from the server at this time.<br>Please try again later.');
		}
	}
	catch (err) {
		console.warn('Error building the account settings page: ', err);
	}
}

async function displayClientStatsPage(evt) {
	evt.preventDefault();
	setActiveTab(evt, tabs, fm);

	// Imports
	const { default: ManageClientStats } = await import("../../classes/ManageClientStats.js");
	const { displayClientsWithNthHorses } = await import("./helpers/client-stats/clientStatsHelpers.js");

	// Create a fragment to append dom elements to
	const fragment = document.createDocumentFragment();

	// Include the ManageStats class
	const manageStats = new ManageClientStats();

	// Get the client stats for the user
	const stats = await manageStats.getClientStatsForUser();

	// Clear the tab container content
	tabContentContainer.innerHTML = '';

	if (stats) {
		stats.forEach(async stat => {
			const statContainer = buildEle({
				type: 'div',
				myClass: ['w3-padding-small'],
				text: ` ${stat.num_horses} horses.`
			});

			const clickSpan = buildEle({
				type: 'span',
				myClass: ['w3-pointer', 'w3-underline', 'w3-text-blue'],
				attributes: { 'data-horses': `${stat.num_horses}` },
				text: `${stat.num_clients} clients with:`,
			});

			statContainer.prepend(clickSpan);
			fragment.appendChild(statContainer);

			// Set an event listener for the clickSpan, This will show all clients with nth horses.
			addListener(clickSpan, 'click', (evt) => displayClientsWithNthHorses(evt, tabContentContainer));
		});

		tabContentContainer.appendChild(fragment);
		return;
	}

	tabContentContainer.innerHTML = 'You don\'t have any clients listed.';
}

async function displayMonthlyProjectionSelectElement(evt) {
	evt.preventDefault();

	setActiveTab(evt, tabs, fm);

	try {
		// Imports
		const { getMonthlyProjections } = await import("./helpers/projections/monthlyProjectionsHelpers.js");

		// Build the select container
		const selectContainer = buildEle({ type: 'div', attributes: { 'id': 'select-container' }, myClass: ['w3-padding-small'] });

		// Title Container
		const projectionTitleContainer = buildEle({ type: 'div', myClass: ['w3-center',] });

		// Projections Title
		const projectionTitle = buildEle({ type: 'h4', text: 'Select a Month' });

		// Projection Errors
		const pfm = buildEle({ type: 'div', attributes: { 'id': 'projection-form-msg' }, myClass: ['w3-center'] });

		// Append the Title
		selectContainer.appendChild(projectionTitleContainer).appendChild(projectionTitle);

		// Append the pfm
		selectContainer.appendChild(pfm);

		// Build the select element with the months
		const selectElement = buildEle({ type: 'select', attributes: { 'id': 'month' }, myClass: ['w3-input', 'w3-border'] });
		const optionTitle = buildEle({ type: 'option', attributes: { 'value': '' }, text: 'Select a Month' });
		selectElement.appendChild(optionTitle);

		// Array of months
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

		// Create an option element for each month and append it to the select element
		months.forEach((month, index) => {
			const option = buildEle({ type: 'option', attributes: { 'value': index + 1 }, text: month });
			selectElement.appendChild(option);
		});

		// Create the container to show the data in
		const projectionContainer = buildEle({ type: 'div', attributes: { 'id': 'projection-container' } });

		// Append the select element to the container and the container to the tabContentContainer
		selectContainer.appendChild(selectElement);
		tabContentContainer.innerHTML = '';
		tabContentContainer.appendChild(selectContainer);

		// Append the projection container to the tabContentContainer
		tabContentContainer.appendChild(projectionContainer);

		// Set the event listener for the select element
		selectElement.addEventListener('change', getMonthlyProjections);
	}
	catch (err) {
		console.warn('Error building the select element for monthly projections: ', err);
	}
}
