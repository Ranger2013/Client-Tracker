import { formatDate, formatTime, getSMSWeekday, isFutureDate, sortByTrimDateAndAppTime } from "../../../../../date/dateUtils.js";
import { buildEle, myError } from "../../../../../dom/domUtils.js";
import selectClientMenuPage from "../../../../../navigation/selectClientMenuPage.js";
import { cleanUserOutput } from "../../../../../string/stringUtils.js";
import ManageClient from "../../../../../../classes/ManageClient.js";
import ManageUser from "../../../../../../classes/ManageUser.js";

/**
 * Main function to build the client list.
 * @param {Object} options - Configuration options
 * @param {string} [options.active=''] - Active status filter
 * @param {number} [options.clientID=null] - Client ID
 * @param {string} [options.primaryKey=null] - Primary key
 * @returns {Promise<[DocumentFragment, number]>}
 */
export default async function buildClientList({ active = '', clientID = null, primaryKey = null }) {
    try {
        const [clientList, userSettings] = await Promise.all([
            fetchClientList(active, clientID, primaryKey),
            fetchUserSettings()
        ]);

        if (!clientList?.length) {
            return [document.createDocumentFragment(), 0];
        }

        const fragment = document.createDocumentFragment();
        const uniqueClientIDs = new Set();
        let counter = 0;

        await handleNoSettings({colorOptions: userSettings.color_options, dateTime: userSettings.date_time});
        await processClientList(clientList, active, primaryKey, fragment, uniqueClientIDs, counter, userSettings);

        return [fragment, uniqueClientIDs.size];
    } 
    catch (err) {
        await handleError({
            filename: 'buildClientList.js',
            consoleMsg: 'Failed to build client list',
            err,
            userMsg: 'Unable to load client list. Please try again.',
            errorEle: 'page-msg'
        });
        throw err;
    }
}

/**
 * Process the client list and build UI elements
 * @private
 */
async function processClientList(clientList, active, primaryKey, fragment, uniqueClientIDs, counter, userSettings) {
    try {
        clientList.sort((a, b) => sortByTrimDateAndAppTime(a, b, true));

        for (const [index, client] of clientList.entries()) {
            if (!shouldProcessClient(client, active, primaryKey)) {
                continue;
            }

            if (!uniqueClientIDs.has(client.cID)) {
                uniqueClientIDs.add(client.cID);
                counter++;
            }

            const clientBlock = await buildClientListBlock(
                client, 
                index, 
                userSettings.color_options, 
                userSettings.date_time
            );

            fragment.appendChild(clientBlock);
        }
    }
    catch (err) {
        await handleError({
            filename: 'buildClientList.js',
            consoleMsg: 'Failed to process client list',
            err,
            userMsg: 'Error processing client data',
            errorEle: 'page-msg'
        });
        throw err;
    }
}

/**
 * Check if client should be processed based on filters
 * @private
 */
function shouldProcessClient(client, active, primaryKey) {
    if (typeof active === 'string' && client.active.toLowerCase() === active.toLowerCase()) {
        return true;
    }
    
    if (client.primaryKey === primaryKey) {
        return true;
    }

    return false;
}

/**
 * Builds a client list block element.
 * 
 * @param {Object} client - The client data.
 * @param {number} index - The index of the client.
 * @param {Object} colorOptions - The color options for the schedule.
 * @param {Object} dateTime - The date and time format options.
 * @returns {Promise<HTMLElement>} - A promise that resolves to the client list block element.
 * @throws {Error} - Throws an error if there is an issue with building the client list block.
 */
async function buildClientListBlock(client, index, colorOptions, dateTime) {
	try {

		// Show a message if the user doesn't have the settings set up
		await handleNoSettings(colorOptions, dateTime);
		
		const [style, clientAnchor, clientAddress, clientTrimDate, clientMenu] = await Promise.all([
			getScheduleColorOptions(client.trim_date, colorOptions),
			buildClientAnchor(client),
			buildClientAddress(client),
			buildClientTrimDate(client, dateTime),
			buildClientMenu(client, index + 1)
		]);

		// Get weekday for search value
        const appDate = new Date(client.trim_date + 'T00:00');
        const weekDay = appDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
		let noSettingsMsg;

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
	catch (err) {
		await handleError({
            filename: 'buildClientList.js',
            consoleMsg: 'Failed to build client list block',
            err,
            userMsg: 'Error building client list block',
            errorEle: 'page-msg'
        });
		throw err;
	}
}

async function handleNoSettings({colorOptions, dateTime}){
	try{
		let settingsMsg = '';

		if(Object.keys(colorOptions).length === 0) {
			settingsMsg += 'Please set your color options in the settings.<br>';
		}

		if(Object.keys(dateTime).length === 0) {
			settingsMsg += 'Please set your date and time options in the settings.';
		}

		if(settingsMsg !== '') {
			myError('page-msg', settingsMsg);
		}
	}
	catch(err){
		await handleError({
            filename: 'buildClientList.js',
            consoleMsg: 'Failed to handle no settings',
            err,
            userMsg: 'Error handling settings',
            errorEle: 'page-msg'
        });
		throw err;
	}
}

/**
 * Determines the style for the schedule based on the date difference.
 * @param {string} date - The date string in the format 'YYYY-MM-DD'.
 * @param {Object} option - The color options for different date ranges.
 * @param {string} option.color_7 - The color for dates 7 or more days in the future.
 * @param {string} option.color_6_3 - The color for dates between 3 and 6 days in the future.
 * @param {string} option.color_2 - The color for dates 2 days in the future.
 * @param {string} option.color_tomorrow - The color for dates 1 day in the future.
 * @param {string} option.color_today - The color for today's date.
 * @param {string} option.over_due - The color for overdue dates.
 * @param {string} option.text_color - The text color for all date ranges.
 * @returns {Promise<string>} The style string for the schedule.
 */
async function getScheduleColorOptions(date, option) {
    try {
        const diff = isFutureDate(date);
        const baseStyle = `color: ${option.text_color}`;
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
        await handleError({
            filename: 'buildClientList.js',
            consoleMsg: 'Failed to get schedule color options',
            err,
            userMsg: 'Error getting schedule color options',
            errorEle: 'page-msg'
        });
        throw err;
    }
}

/**
 * Builds the client anchor element.
 * @param {Object} client - The client object.
 * @returns {Promise<HTMLElement>} The client anchor element.
 */
async function buildClientAnchor(client) {
	try {
		return buildEle({
			type: 'a',
			attributes: {
				href: `sms://${cleanUserOutput(client.phone)}`,
				title: `Text ${cleanUserOutput(client.client_name)}`
			},
			myClass: ['client-name'],
			text: `${cleanUserOutput(client.client_name)}`
		});
	} catch (err) {
		await handleError({
            filename: 'buildClientList.js',
            consoleMsg: 'Failed to build client anchor',
            err,
            userMsg: 'Error building client anchor',
            errorEle: 'page-msg'
        });
		throw err;
	}
}

/**
* Builds the client address element.
* @param {Object} client - The client object.
* @returns {Promise<string>} The client address string.
*/
async function buildClientAddress(client) {
	try {
		let clientAddress = `${cleanUserOutput(client.street)},<br>${cleanUserOutput(client.city)}, ${cleanUserOutput(client.state)}`;
		clientAddress += (client.zip && client.zip !== '') ? `, ${cleanUserOutput(client.zip)}` : '';
		return clientAddress;
	}
	catch (err) {
		await handleError({
            filename: 'buildClientList.js',
            consoleMsg: 'Failed to build client address',
            err,
            userMsg: 'Error building client address',
            errorEle: 'page-msg'
        });
		throw err;
	}
}

/**
 * Builds the client trim date element.
 * @param {Object} client - The client object.
 * @param {Object} dateTime - The date and time format settings.
 * @returns {Promise<HTMLElement>} The client trim date element.
 */
async function buildClientTrimDate(client, dateTime) {
	try {
		const appDate = new Date(client.trim_date + 'T00:00');
		const weekDay = appDate.toLocaleString('en-US', { weekday: 'long' });
		const dateCol = buildEle({ type: 'div' });
		const longDay = buildEle({ type: 'div', text: weekDay });
		const appDateSpanLarge = buildEle({ type: 'span', myClass: ['app-date'], text: cleanUserOutput(formatDate(client.trim_date, dateTime.date_format)) });
		const appDateSmall = buildEle({ type: 'div', myClass: ['w3-hide-medium', 'w3-hide-large'], text: `At ${formatTime(client.app_time, dateTime.time_format)}` });

		dateCol.appendChild(longDay);
		dateCol.appendChild(appDateSpanLarge);
		dateCol.appendChild(appDateSmall);

		return dateCol;
	}
	catch (err) {
		await handleError({
            filename: 'buildClientList.js',
            consoleMsg: 'Failed to build client trim date',
            err,
            userMsg: 'Error building client trim date',
            errorEle: 'page-msg'
        });
		throw err;
	}
}

/**
 * Builds the client menu element.
 * @param {Object} client - The client object.
 * @param {number} index - The index of the client in the list.
 * @returns {Promise<HTMLElement>} The client menu element.
 * @throws {Error} - Throws an error if there is an issue with building the client menu
 */
async function buildClientMenu(client, index) {
	try {
		// Set the time, weekday and the SMS message for the auto complete confirming appointment
		const weekday = getSMSWeekday(client.trim_date);
		const clientAppointmentTime = formatTime(client.app_time, 12);
		const addressForDirections = encodeURI(`${client.street},${client.city},${client.state}`);
		const clientID = client.cID;
		const primaryKey = client.primaryKey;

		// Get today's date and tomorrow's date
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);

		// Format the appointment date
		const [year, month, day] = client.trim_date.split('-').map(Number);
		const appointmentDate = new Date(year, month - 1, day);

		// Use toLocaleDateString to avoid the UTC issues
		const tomorrowString = tomorrow.toLocaleDateString('en-US');
		const appointmentDateString = appointmentDate.toLocaleDateString('en-US');

		// Set the SMS message
		const sms = `Wanting to confirm your farrier appointment for ${appointmentDateString === tomorrowString ? 'tomorrow' : weekday} at ${clientAppointmentTime}`;

		// Build the main menu container that holds all the links
		const mainClientMenuContainer = buildEle({ type: 'div', myClass: ['w3-dropdown-click'] });

		const contentId = `button-${index}`;
        
        // Build the button with data-target attribute
        const mainClientMenuButton = buildEle({
            type: 'button',
            attributes: {
                'data-action': 'manage-client',
                'data-client-id': client.cID,
                'data-primary-key': client.primaryKey,
                'data-target': contentId // Add this line
            },
            myClass: ['w3-button', 'w3-padding-small', 'w3-round', 'w3-dark-grey', 'w3-text-white', 'w3-small'],
            text: 'Manage Client'
        });

        // Build the content container with matching ID
        const mainClientMenuContent = buildEle({
            type: 'div',
            attributes: {
                id: contentId,
                style: 'right: 0px; width: 200px;'
            },
            myClass: ['w3-dropdown-content', 'w3-bar-block', 'w3-border', 'w3-border-white']
        });

		// Build the first 3 links that do not have their own menu
		const confirmAppointment = buildEle({
			type: 'a',
			attributes: {
				href: `sms://${cleanUserOutput(client.phone)}?&body=${sms}`,
			},
			myClass: ['w3-border-bottom', 'w3-border-white', 'w3-bar-item', 'w3-button', 'w3-text-white', 'w3-dark-grey'],
			text: 'Confirm Appointment'
		});

		const clientDirections = buildEle({
			type: 'a',
			attributes: {
				href: `http://maps.google.com/maps?q=${addressForDirections}`,
				target: '_blank'
			},
			myClass: ['w3-border-bottom', 'w3-border-white', 'w3-bar-item', 'w3-button', 'w3-dark-grey', 'w3-text-white', 'w3-hide-large'],
			text: 'Directions'
		});

		const clientPhone = buildEle({
			type: 'a',
			attributes: {
				href: `tel:${cleanUserOutput(client.phone)}`
			},
			myClass: ['w3-border-bottom', 'w3-border-white', 'w3-bar-item', 'w3-button', 'w3-dark-grey', 'w3-text-white', 'w3-hide-large'],
			text: 'Call'
		});

		// Append the main parts
		mainClientMenuContainer.appendChild(mainClientMenuButton);
		mainClientMenuContainer.appendChild(mainClientMenuContent);
		mainClientMenuContent.appendChild(confirmAppointment);
		mainClientMenuContent.appendChild(clientDirections);
		mainClientMenuContent.appendChild(clientPhone);

		// Build the params needed for the drop down menu
		const menuParams = {
			trimming: {
				id: `trims-${index}`,
				cID: clientID,
				primaryKey: primaryKey,
				buttonText: 'Trimming/Shoeing',
				pages: {
					add: {
						href: {
							address: `../../trimming/add/?cID=${clientID}&key=${primaryKey}`,
							text: 'Add Trim/Shoeing'
						},
						pageName: 'add-trimming'
					},
					view: {
						href: {
							address: `../../trimming/view/?cID=${clientID}&key=${primaryKey}`,
							text: 'View Dates'
						},
						pageName: 'view-trim-dates'
					}
				}
			},
			clientHorses: {
				id: `horses-${index}`,
				cID: clientID,
				primaryKey: primaryKey,
				buttonText: 'Client Horses',
				pages: {
					add: {
						href: {
							address: `../../client-horses/add/?cID=${clientID}&key=${primaryKey}`,
							text: 'Add Horse'
						},
						pageName: 'add-horse'
					},
					edit: {
						href: {
							address: `../../client-horses/edit/?cID=${clientID}&key=${primaryKey}`,
							text: 'Edit Horse'
						},
						pageName: 'edit-horse'
					}
				}
			}
		};

		const menu = await buildClientDropDownMenu(menuParams);

		// Add the menu
		mainClientMenuContent.appendChild(menu);

		// Build the edit client link
		const editClientLink = buildEle({
			type: 'a',
			attributes: {
				href: `../edit-client/?cID=${clientID}&key=${primaryKey}`
			},
			myClass: ['w3-bar-item', 'w3-button', 'w3-text-white', 'w3-black'],
			text: 'Edit Client'
		});

		// Listen for the edit client link
		editClientLink.addEventListener('click', async (evt) => await selectClientMenuPage(evt, 'edit-client', clientID, primaryKey));

		// Add the edit client to the end
		mainClientMenuContent.appendChild(editClientLink);

		return mainClientMenuContainer;
	}
	catch (err) {
		await handleError({
            filename: 'buildClientList.js',
            consoleMsg: 'Failed to build client menu',
            err,
            userMsg: 'Error building client menu',
            errorEle: 'page-msg'
        });
		throw err;
	}
}

/**
 * Builds the client drop down menu.
 * @param {Object} params - The parameters for building the drop down menu.
 * @returns {Promise<DocumentFragment>} The document fragment containing the drop down menu.
 */
async function buildClientDropDownMenu(params) {
	try {
		const fragment = document.createDocumentFragment();

		Object.keys(params).forEach(param => {
			const clientId = params[param].cID;
			const primaryKey = params[param].primaryKey;
			const menuId = params[param].id; // e.g., 'trims-1' or 'horses-1'

			// Build dropdown container
			const buildDropDown = buildEle({ type: 'div', myClass: ['w3-dropdown-click'] });

			// Add data-target to button
			const button = buildEle({
				type: 'button',
				attributes: {
					'data-action': 'manage-client',
					'data-target': menuId
				},
				myClass: [
					'w3-button',
					'w3-border-bottom',
					'w3-border-white',
					'w3-text-white',
					'w3-padding-small',
					'w3-black',
				],
				text: '<img src="/public/siteImages/caret-down-white.svg">&nbsp;' + params[param].buttonText
			});

			 // Build menu container with matching ID
            const menuContainer = buildEle({
                type: 'div',
                attributes: {
                    id: menuId,
                    style: 'position: relative'
                },
                myClass: ['w3-dropdown-content', 'w3-bar-block', 'w3-blue-grey']
            });

			// Set up the pages
			const pages = params[param].pages;

			// Looping through each page
			const pageElements = Object.keys(pages).map(page => {
				// Declare the href and anchor text
				const href = pages[page].href.address;
				const text = pages[page].href.text;
				const pageToBuild = pages[page].pageName;

				const pageLink = buildEle({
					type: 'a',
					attributes: {
						href: href
					},
					myClass: [
						'w3-border-bottom',
						'w3-bar-item',
						'w3-button',
						'w3-text-white'
					],
					text: text
				});

				pageLink.addEventListener('click', async (evt) => await selectClientMenuPage(evt, pageToBuild, clientId, primaryKey));

				return pageLink;
			});

			buildDropDown.appendChild(button);
			buildDropDown.appendChild(menuContainer);

			// Loop through the array of anchor nodes and append them to the menu container
			pageElements.forEach(element => menuContainer.appendChild(element));

			fragment.appendChild(buildDropDown);
		});
		return fragment;
	}
	catch (err) {
		await handleError({
            filename: 'buildClientList.js',
            consoleMsg: 'Failed to build client drop down menu',
            err,
            userMsg: 'Error building client drop down menu',
            errorEle: 'page-msg'
        });
		throw err;
	}
}

/**
 * Fetch client list data
 * @private
 */
async function fetchClientList(active, clientID, primaryKey) {
    try {
        const manageClient = new ManageClient();
    
        if (active && (active === 'yes' || active === 'no')) {
            return await manageClient.getClientScheduleList();
        }
        else {
            const cID = Number(clientID);
            return await manageClient.getClientInfo({ primaryKey });
        }
    }
    catch (err) {
        await handleError({
            filename: 'buildClientList.js',
            consoleMsg: 'Failed to fetch client list',
            err,
            userMsg: 'Error fetching client list',
            errorEle: 'page-msg'
        });
        throw err;
    }
}

/**
 * Fetch user settings
 * @private
 */
async function fetchUserSettings() {
    try {
        const manageUser = new ManageUser();
        return await manageUser.getSettings();
    }
    catch (err) {
        await handleError({
            filename: 'buildClientList.js',
            consoleMsg: 'Failed to fetch user settings',
            err,
            userMsg: 'Error fetching user settings',
            errorEle: 'page-msg'
        });
        throw err;
    }
}
