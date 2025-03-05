import { formatDate, formatTime, getSMSWeekday } from '../../../../../utils/date/dateUtils.js';
import { buildEle } from '../../../../../utils/dom/elements.js';
import { cleanUserOutput } from '../../../../../utils/string/stringUtils.js';
import { buildElementsFromConfig } from './utilities.js';

/**
 * Calculates the difference in days between the current date and a target date.
 * 
 * @param {string} value - The target date string in the format 'YYYY-MM-DD'.
 * @returns {number} The difference in days between the current date and the target date.
 *                   A positive number indicates a future date, zero indicates today, and a negative number indicates a past date.
 */
const isFutureDate = (value) => {
	var now = new Date();
	var target = new Date(value + 'T00:00');

	// Calculate the difference in time
	var timeDiff = target.getTime() - now.getTime();

	// Calculate the difference in days
	var dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

	return dayDiff;
}

export default async function buildClientListRow({
	client,
	index,
	colorOptions,
	dateTime,
}) {
	try {
		const style = getScheduleColorOptions({ trimDate: client.trim_date, colorOptions });
		const clientAnchor = buildClientAnchor({ client });
		const clientAddress = buildClientAddress({ client });
		const clientTrimDate = buildClientTrimDate({ client, dateTime });
		const clientMenu = buildClientMenu({ client, index });

		const appDate = new Date(client.trim_date + 'T00:00');
		const weekDay = appDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

		const clientListBlock = buildEle({
			type: 'div',
			attributes: {
				id: `client-list-block-${index + 1}`,
				style: style,
			},
			myClass: ['w3-row', 'w3-padding-small', 'w3-border-left', 'w3-border-right', 'w3-border-bottom']
		});

		const columns = [
			{
				myClass: ['w3-col', 'm2', 's4', 'w3-center'],
				content: clientAnchor,
				searchable: {
					type: 'client-name',
					value: cleanUserOutput(client.client_name)
				}
			},
			{
				myClass: ['w3-col', 'm2', 'w3-center', 'w3-hide-small'],
				content: clientAddress,
				searchable: {
					type: 'address',
					value: `${cleanUserOutput(client.street)} ${cleanUserOutput(client.city)} ${cleanUserOutput(client.state)}`
				}
			},
			{
				myClass: ['w3-col', 'm2', 'w3-center', 'w3-hide-small'],
				content: cleanUserOutput(client.phone),
				searchable: {
					type: 'phone',
					value: cleanUserOutput(client.phone)
				}
			},
			{
				myClass: ['w3-col', 'm2', 'w3-center', 'w3-hide-small'],
				content: cleanUserOutput(formatTime(client.app_time, dateTime.time_format)),
				searchable: {
					type: 'app-time',
					value: cleanUserOutput(client.app_time)
				}
			},
			{
				myClass: ['w3-col', 'm2', 's4', 'w3-center'],
				content: clientTrimDate,
				searchable: {
					type: 'app-date',
					// Include both date and weekday in search value
					value: `${client.trim_date} ${weekDay}`
				}
			},
			// Menu column doesn't need search attributes
			{
				myClass: ['w3-col', 'm2', 's4', 'w3-center', 'w3-margin-top'],
				content: clientMenu
			}
		];

		columns.forEach(col => {
			const columnElement = buildEle({
				type: 'div',
				myClass: col.myClass,
				text: col.content,
				attributes: col.searchable ? {
					'data-search-type': col.searchable.type,
					'data-search-value': col.searchable.value
				} : undefined
			});
			clientListBlock.appendChild(columnElement);
		});

		return clientListBlock;

	}
	catch (err) { }
}

function getScheduleColorOptions({ trimDate, colorOptions }) {
	try {
		const diff = isFutureDate(trimDate);
		const baseStyle = `color: ${colorOptions.text_color}`;
		let backgroundColor;

		switch (true) {
			case (diff >= 7):
				backgroundColor = option.color_7;
				break;

			case (diff >= 3):  // diff < 7 is implicit since previous case failed
				backgroundColor = option.color_6_3;
				break;

			case (diff === 2):
				backgroundColor = option.color_2;
				break;

			case (diff === 1):
				backgroundColor = option.color_tomorrow;
				break;

			case (diff === 0):
				backgroundColor = option.color_today;
				break;

			default:  // overdue
				backgroundColor = option.over_due;
				break;
		}

		return `background-color:${backgroundColor}; ${baseStyle}`;
	}
	catch (err) {
		console.log(err);

	}
}

function buildClientAnchor({ client }) {
	try {
		return buildEle({
			type: 'a',
			attributes: {
				href: `sms://${cleanUserOutput(client.phone)}`,
				title: `Text ${cleanUserOutput(client.client_name)}`,
			},
		});
	}
	catch (err) { }
}

function buildClientAddress({ client }) {
	try {
		let clientAddress = `${cleanUserOutput(client.street)},<br>${cleanUserOutput(client.city)}, ${cleanUserOutput(client.state)}`;
		clientAddress += (client.zip && client.zip !== '') ? `, ${cleanUserOutput(client.zip)}` : '';
		return clientAddress;
	}
	catch (err) { }
}

function buildClientTrimDate({ client, dateTime }) {
	try {
		const appDate = new Date(client.trim_date + 'T00:00');
		const weekDay = appDate.toLocaleDateString('en-US', { weekday: 'long' });
		const dateCol = buildEle({ type: 'div' });
		const longDay = buildEle({ type: 'div', text: weekDay });
		const appDateSpanLarge = buildEle({ type: 'span', myClass: ['app-date'], text: cleanUserOutput(formatDate(client.trim_date, dateTime)) });
		const appDateSmall = buildEle({ type: 'div', myClass: ['w3-hide-medium', 'w3-hide-large'], text: `At ${fromatTime(client.app_time, dateTime.time_format)}` });

		dateCol.append(longDay, appDateSpanLarge, appDateSmall);
		return dateCol;
	}
	catch (err) { }
}

function buildClientMenu({ client, index }) {
	try {
		const CLIENT_MENU_CONFIG = {
			container: { type: 'div', myClass: ['w3-dropdown-click'] },
			menuButton: {
				type: 'button',
				attributes: {
					'data-action': 'manage-client',
					'data-client-id': client.cID,
					'data-primary-key': client.primaryKey,
					'data-target': `button-${index}`,
				},
				myClass: ['w3-button', 'w3-padding-small', 'w3-round-large', 'w3-dark-grey', 'w3-text-white', 'w3-small'],
				text: 'Manage Client',
			},
			menuContent: {
				type: 'div',
				attributes: {
					id: `button-${index}`,
					style: 'right: 0px; width: 200px;',
				},
				myClass: ['w3-dropdown-content', 'w3-bar-block', 'w3-border', 'w3-border-white'],
			},
			confirm: {
				type: 'a',
				attributes: {
					href: `sms://${cleanUserOutput(client.phone)}?&body=${sms}`,
				},
				myClass: ['w3-border-bottom', 'w3-border-white', 'w3-bar-item', 'w3-button', 'w3-text-white', 'w3-dark-grey'],
				text: 'Confirm Appointment',
			},
			directions: {
				type: 'a',
				attributes: {
					href: `https://maps.google.com/maps?q=${addressForDirections}`,
					target: '_blank',
				},
				myClass: ['w3-border-bottom', 'w3-border-white', 'w3-bar-item', 'w3-button', 'w3-text-white', 'w3-dark-grey', 'w3-hide-large'],
				text: 'Directions',
			},
			call: {
				type: 'a',
				attributes: {
					href: `tel:${cleanUserOutput(client.phone)}`,
				},
				myClass: ['w3-border-bottom', 'w3-border-white', 'w3-bar-item', 'w3-button', 'w3-text-white', 'w3-dark-grey', 'w3-hide-large'],
				text: 'Call',
			},
		};

		const DROPDOWN_MENU_CONFIG = {
			trimming: {
				id: `trims-${index}`,
				cID: client.cID,
				primaryKey: client.primaryKey,
				buttonText: 'Trimming/Shoeing',
				pages: {
					add: {
						href: {
							address: `../../trimming/add/?cID=${client.cID}&key=${client.primaryKey}`,
							text: 'Add Trim/Shoeing'
						},
						pageName: 'add-trimming'
					},
					view: {
						href: {
							address: `../../trimming/view/?cID=${client.cID}&key=${client.primaryKey}`,
							text: 'View Dates'
						},
						pageName: 'view-trim-dates'
					}
				}
			},
			clientHorses: {
				id: `horses-${index}`,
				cID: client.cID,
				primaryKey: client.primaryKey,
				buttonText: 'Client Horses',
				pages: {
					add: {
						href: {
							address: `../../client-horses/add/?cID=${client.cID}&key=${client.primaryKey}`,
							text: 'Add Horse'
						},
						pageName: 'add-horse'
					},
					edit: {
						href: {
							address: `../../client-horses/edit/?cID=${client.cID}&key=${client.primaryKey}`,
							text: 'Edit Horse'
						},
						pageName: 'edit-horse'
					}
				}
			}
		};

		// Set the time, weekday and the sms message for the auto complete confirming the appointment
		const weekday = getSMSWeekday(client.trim_date);
		const clientAppointmentTime = formatTime(client.app_time, 12);
		const addressForDirections = encodeURI(`${client.street},${client.city},${client.state}`);
		const clientId = client.cID,
		const primaryKey = client.primaryKey;

		// Get todays date and tomorrows date
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);

		// Format the appointment date
		const [year, month, day] = client.trim_date.split('-').map(Number);
		const appointmentDate = new Date(year, month - 1, day);

		// Use toLocalDateString to avoid the UTC issues
		const tomorrowString = tomorrow.toLocaleDateString('en-US');
		const appointmentDateString = appointmentDate.toLocaleDateString('en-US');

		// Set the SMS message
		const sms = `Wanting to confirm your farrier appointment for ${appointmentDateString === tomorrowString ? 'tomorrow' : weekday} at ${clientAppointmentTime}.`;

		const mainElements = buildElementsFromConfig(CLIENT_MENU_CONFIG);
	}
	catch (err) { }
}

function buildDropDownMenuConfig(config) {
	try {
		const fragment = document.createDocumentFragment();

		Object.keys(config).forEach(key => {
			const clientId = config[key].cID;
			const primaryKey = config[key].primaryKey;
			const menuId = config[key].id; // e.g. 'trims-1' or 'horses-1'

			// Build the dropdown container
			const buildDropDown = buildEle({ type: 'div', myClass: ['w3-dropdown-click'] });

			// Add the data-target to the button
			const button = buildEle({
				type: 'button',
				attributes: {
					'data-action': 'manage-client',
					'data-target': menuId,
				},
				myClass: ['w3-button', 'w3-border-bottom', 'w3-border-white', 'w3-text-white', 'w3-padding-small', 'w3-black'],
				text: `<img src="/public/siteImages/caret-down-white.svg">&nbsp;${config[key].buttonText}`,
			});

			// Build the menu container with the matching ID
			const menuContainer = buildEle({
				type: 'div',
				attributes: {
					id: menuId,
					style: 'position: relative',
				},
				myClass: ['w3-dropdown-content', 'w3-bar-block', 'w3-blue-grey'],
			});

			// Set up the pages
			const pages = config[key].pages;

			// Looping through each page
			const pageElements = Object.keys(pages).map(page => {
				// Declare the href and anchor text
				const href = pages[page].href.address;
				const text = pages[page].href.text;
				const pageToBuild = pages[page].pageName;

				const pageLink = buildEle({
					type: 'a',
					attributes: { href },
					myclass: ['w3-border-bottom', 'w3-bar-item', 'w3-button', 'w3-text-white'],
					text,
				});

				return pageLink;
			}); // End map

			// Appen page elements to menu container
			menuContainer.append(...pageElements);

			// Append the button, menu container to the dropdown

			buildDropDown.append(button, menuContainer);
			fragment.appendChild(buildDropDown);
		});
		return fragment
	}
	catch (err) { }
}

