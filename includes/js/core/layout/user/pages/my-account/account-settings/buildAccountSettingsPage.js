import { getValidationToken } from '../../../../../../tracker.js';
import { accountAPI } from '../../../../../network/api/apiEndpoints.js';
import { fetchData } from '../../../../../network/services/network.js';
import { buildElementsFromConfig, buildElementTree } from '../../../../../utils/dom/elements.js';
import { removeListeners } from '../../../../../utils/dom/listeners.js';

// Setup debug mode
const COMPONENT = 'Display Account Settings Page';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

const COMPONENT_ID = 'build-account-settings-page';

export default async function buildAccountSettingsPage({ tabContentContainer, manageUser, componentId }) {
	const [getUserData, passwordLockoutStatus, pageComponents] = await Promise.all([
		getUserInformation(),
		getPasswordLockoutStatus(),
		buildMainPageComponents(),
	]);

	const formComponents = await buildFormComponents({ userData: getUserData, lockoutStatus: passwordLockoutStatus });

	renderPage({ tabContentContainer, pageComponents, formComponents });

	await initializeAccountHandlers({ tabContentContainer, componentId: COMPONENT_ID, manageUser });

	return () => removeListeners(COMPONENT_ID);
}

async function buildMainPageComponents() {
	const PAGE_MAPPING = {
		container: {
			type: 'div',
			attributes: { id: 'account-container' },
			myClass: ['w3-padding-small'],
		},
		accountMsg: {
			type: 'div',
			attributes: { id: 'account-msg' },
			myClass: ['w3-center'],
		},
		title: {
			type: 'h6',
			attributes: { style: 'margin-bottom: 0px' },
			text: 'Account Settings',
		},
		info: {
			type: 'div',
			myClass: ['w3-small'],
			text: `<span class="w3-underline w3-bold">For your security:</span>
			<ul>
			<li>An email will be sent to the email on file. You will need to click the verify link in the email for your changes to take effect.</li>
			<li>You will then need to log back in.</li>
			<li>You have 3 attempts to enter your current password correctly when changing your password.</li>
			<li>Click on a specific name to access the form.</li>			
			<li>If you do not have access to your old email, please contact us through the 'Help Desk' or contact us directly from the main home page so we can assist you.</li>
			</ul>`
		},
	};

	return buildElementsFromConfig(PAGE_MAPPING);
}

async function buildFormComponents({ userData, lockoutStatus }) {
	const attempts = lockoutStatus?.attempts;
debugLog('Password Attempts: ', attempts);
	const PAGE_MAPPING = {
		type: 'form',
		attributes: { id: 'account-form' },
		children: {
			'username-container': {
				type: 'div',
				attributes: { id: 'username-container' },
				myClass: ['w3-row', 'w3-margin-top'],
				children: {
					colOne: {
						type: 'div',
						myClass: ['w3-col', 'm6', 'w3-padding-small'],
						children: {
							label: {
								type: 'label',
								attributes: { id: 'username-label', for: 'username' },
								text: 'User Name:',
							},
						},
					},
					colTwo: {
						type: 'div',
						myClass: ['w3-col', 'm6', 'w3-padding-small', 'w3-hide'],
						attributes: { id: 'username-input-container' },
						children: {
							input: {
								type: 'input',
								attributes: {
									id: 'username',
									name: 'username',
									type: 'text',
									value: userData.username,
									autocomplete: 'username',
									placeholder: 'Enter your username',
									title: 'Enter your username',
									required: true,
									disabled: true,
								},
								myClass: ['w3-input', 'w3-border'],
							},
							error: {
								type: 'div',
								attributes: { id: 'username-error' },
								myClass: ['w3-padding-small', 'w3-hide'],
							},
						},
					},
				},
			},
			'password-container': {
				type: 'div',
				attributes: { id: 'password-container' },
				myClass: ['w3-row', 'w3-margin-top'],
				children: {
					colOne: {
						type: 'div',
						myClass: ['w3-col', 'm6', 'w3-padding-small'],
						children: {
							label: {
								type: 'label',
								attributes: { id: 'password-label', for: 'password' },
								text: 'Password:',
							},
						},
					},
					colTwo: {
						type: 'div',
						myClass: ['w3-col', 'm6', 'w3-padding-small', 'w3-hide'],
						attributes: { id: 'password-input-container' },
						children: attempts < 3 ? {
							label: {
								type: 'label',
								attributes: { for: 'current-password' },
								text: 'Enter current password: ',
								children: {
									input: {
										type: 'input',
										attributes: {
											id: 'current-password',
											name: 'current_password',
											type: 'password',
											autocomplete: 'current-password',
											placeHolder: 'Enter your current password',
											title: 'Enter your current password',
											required: true,
											disabled: true,
										},
										myClass: ['w3-input', 'w3-border'],
									},
									error: {
										type: 'div',
										attributes: { id: 'current-password-error' },
										myClass: ['w3-padding-small', 'w3-hide'],
									},
								},
							},
							label1: {
								type: 'label',
								attributes: { for: 'new-password', style: 'display: inline-block; width: 100%' },
								myClass: ['w3-margin-top'],
								text: 'Enter new password: ',
								children: {
									input: {
										type: 'input',
										attributes: {
											id: 'new-password',
											name: 'new_password',
											type: 'password',
											autocomplete: 'new-password',
											placeHolder: 'Enter a new password',
											title: 'Enter a new password',
											required: true,
											disabled: true,
										},
										myClass: ['w3-input', 'w3-border'],
									},
									error: {
										type: 'div',
										attributes: { id: 'new-password-error' },
										myClass: ['w3-padding-small', 'w3-hide'],
									},
									strength: {
										type: 'div',
										attributes: { id: 'strength-container' },
										myClass: ['w3-padding-small', 'w3-hide'],
									},
								},
							},
							label2: {
								type: 'label',
								attributes: { for: 'confirm-password', style: 'display: inline-block; width: 100%' },
								myClass: ['w3-margin-top'],
								text: 'Confirm new password: ',
								children: {
									input: {
										type: 'input',
										attributes: {
											id: 'confirm-password',
											name: 'confirm_password',
											autocomplete: 'new-password',
											type: 'password',
											placeHolder: 'Confirm your password',
											title: 'Confirm your password',
											required: true,
											disabled: true,
										},
										myClass: ['w3-input', 'w3-border'],
									},
									error: {
										type: 'div',
										attributes: { id: 'confirm-password-error' },
										myClass: ['w3-padding-small', 'w3-hide'],
									}
								},
							},
						} : {
							lockout: {
								type: 'div',
								myClass: ['w3-col', 's12', 'w3-padding-small'],
								// This same html structure is in the handleAccountSettingsFormSubmission.js file
								text: `
									<div class="w3-panel w3-pale-red w3-leftbar w3-border-red">
										<p>Change password has been locked due to too many failed attempts.</p>
										<p>Please use the "Forgot Password" option or contact support for assistance.</p>
										<div class="w3-padding-small">
											<a id="reset-password" href="#" class="w3-button w3-small w3-blue" title="Reset Password">Reset Password</a>
										</div>
									</div>
								`,
							}
						},
					},
				},
			},
			'company-container': {
				type: 'div',
				attributes: { id: 'company-container' },
				myClass: ['w3-row', 'w3-margin-top'],
				children: {
					colOne: {
						type: 'div',
						myClass: ['w3-col', 'm6', 'w3-padding-small'],
						children: {
							label: {
								type: 'label',
								attributes: { id: 'company-label', for: 'company-name' },
								text: 'Company Name:',
							},
						},
					},
					colTwo: {
						type: 'div',
						myClass: ['w3-col', 'm6', 'w3-padding-small', 'w3-hide'],
						attributes: { id: 'company-input-container' },
						children: {
							input: {
								type: 'input',
								attributes: {
									id: 'company-name',
									name: 'company_name',
									type: 'text',
									value: userData.company_name,
									autocomplete: 'organization',
									placeholder: 'Enter your company name',
									title: 'Enter your company name',
									required: true,
									disabled: true,
								},
								myClass: ['w3-input', 'w3-border'],
							},
							error: {
								type: 'div',
								attributes: { id: 'company-name-error' },
								myClass: ['w3-padding-small', 'w3-hide'],
							},
						},
					},
				},
			},
			'phone-container': {
				type: 'div',
				attributes: { id: 'phone-container' },
				myClass: ['w3-row', 'w3-margin-top'],
				children: {
					colOne: {
						type: 'div',
						myClass: ['w3-col', 'm6', 'w3-padding-small'],
						children: {
							label: {
								type: 'label',
								attributes: { id: 'phone-label', for: 'phone' },
								text: 'Phone Number:',
							},
						},
					},
					colTwo: {
						type: 'div',
						myClass: ['w3-col', 'm6', 'w3-padding-small', 'w3-hide'],
						attributes: { id: 'phone-input-container' },
						children: {
							input: {
								type: 'input',
								attributes: {
									id: 'phone',
									name: 'phone',
									type: 'tel',
									value: userData.phone,
									autocomplete: 'tel',
									placeholder: 'Enter your phone number',
									title: 'Format: 123-456-7890',
									required: true,
									disabled: true,
								},
								myClass: ['w3-input', 'w3-border'],
							},
							error: {
								type: 'div',
								attributes: { id: 'phone-error' },
								myClass: ['w3-padding-small', 'w3-hide'],
							},
						},
					},
				},
			},
			'email-container': {
				type: 'div',
				attributes: { id: 'email-container' },
				myClass: ['w3-row', 'w3-margin-top'],
				children: {
					colOne: {
						type: 'div',
						myClass: ['w3-col', 'm6', 'w3-padding-small'],
						children: {
							label: {
								type: 'label',
								attributes: { id: 'email-label', for: 'email' },
								text: 'Email Address:',
							},
						},
					},
					colTwo: {
						type: 'div',
						myClass: ['w3-col', 'm6', 'w3-padding-small', 'w3-hide'],
						attributes: { id: 'email-input-container' },
						children: {
							input: {
								type: 'input',
								attributes: {
									id: 'email',
									name: 'email',
									type: 'email',
									value: userData.email,
									autocomplete: 'email',
									placeholder: 'Enter your email address',
									title: 'Enter your email address',
									required: true,
									disabled: true,
								},
								myClass: ['w3-input', 'w3-border'],
							},
							error: {
								type: 'div',
								attributes: { id: 'email-error' },
								myClass: ['w3-padding-small', 'w3-hide'],
							},
						},
					},
				},
			},
			'submit-container': {
				type: 'div',
				attributes: { id: 'submit-container' },
				myClass: ['w3-margin-top', 'w3-center', 'w3-hide'],
				children: {
					button: {
						type: 'button',
						attributes: { id: 'submit-button', type: 'submit' },
						myClass: ['w3-button', 'w3-hover-blue-grey', 'w3-black', 'w3-card', 'w3-round-large'],
						text: 'Update Credentials',
					},
				},
			},
		}
	};

	return buildElementTree(PAGE_MAPPING);
}

function renderPage({ tabContentContainer, pageComponents, formComponents }) {
	const { container, accountMsg, title, info } = pageComponents;

	container.append(accountMsg, title, info, formComponents);

	// Clear tab content container
	tabContentContainer.innerHTML = '';

	// Append the main container to the tab content container
	tabContentContainer.appendChild(container);
}

async function getUserInformation() {
	const response = await fetchData({
		api: accountAPI.credentials,
		data: { key: 'get_user_credentials' },
		token: getValidationToken(),
	});

	debugLog('User Information: response: ', response);
	return response?.data;
}

async function initializeAccountHandlers({ tabContentContainer, componentId, manageUser }) {
	try {
		debugLog('Tab Container: ', tabContentContainer);
		const { default: accountSettings } = await import("../../../../../../features/user/ui/my-account/user-account/tabs/account-settings/accountSettingsJS.js");
		await accountSettings({ tabContentContainer, componentId, manageUser });
	}
	catch (err) {
		const { AppError } = await import("../../../../../errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			message: AppError.BaseMessages.system.initialization,
		});
	}
}

async function getPasswordLockoutStatus() {
	try {
		const response = await fetchData({
			api: accountAPI.credentials,
			data: { key: 'get_password_attempts' },
			token: getValidationToken(),
		});

		debugLog('Password Lockout Status: response: ', response);
		return response?.data;
	}
	catch (err) {
		console.warn(err);
	}
}