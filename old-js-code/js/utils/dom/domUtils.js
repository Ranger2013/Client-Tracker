/**
 * Opening and closing of the side bar menu
 * 
 * @param {string} menu - Id of the sidebar menu
 */
export function sideBar(menu) {
	let sideNavigation = document.getElementById(menu);

	sideNavigation.classList.toggle('w3-show');
}

/**
 * 
 * @param {Object} params - The parameters for the function
 * @param {HTMLElement} params.container - The container element that holds the error message
 * @param {boolean} [params.hide=false] - Whether to hide the container after clearing the message
 * @param {HTMLElement} [params.input=false] - The input element from which to remove the error border
 */
export function clearMsg({ container, hide = false, input = null }) {
	
	try {
		if (typeof container === 'string') {
			container = document.getElementById(container);

			if (!container) {
				throw new Error(`Invalid error ID for element ${container}`)
			}
		}

		if (container && container.classList) {
			// Looping through the container's class list backwards
			for (let i = container.classList.length - 1; i >= 0; i--) {
				// Getting the name of each class in the list
				const className = container.classList[i];

				// If the class starts with the w3-text- we are removing it.
				if (className.startsWith('w3-text-')) {
					container.classList.remove(className);
				}
			}

			// Remove the error class and clear the container
			container.classList.remove('error');
			container.innerHTML = '';

			// Lets hide the element container
			if (hide) container.classList.add('w3-hide');

			// If we have an input element, we need to remove the border from around the element
			if (input) {
				if (typeof input === 'string') {
					input = document.getElementById(input);

					if (!input) {
						throw new Error(`Invalid input ID for element ${input}`);
					}
				}
				input.classList.remove('w3-border-error');
			}
		}
	}
	catch (err) {
		console.warn('clearMsg Error: ', err);
	}
};

/**
 * 
 * @param {HTMLElement} ele - The element to display the error message
 * @param {string} msg - The error message to display
 * @param {HTMLElement|string|null} [target=null] - The target element to apply an error border to.
 */
export function myError(ele, msg, target = null) {
	try {
		// Check if ele is an id string
		if (typeof ele === 'string') {
			ele = document.getElementById(ele);

			// Make sure we have this element on the page.
			if (!ele) {
				throw new Error(`myError Element with ID "${ele}" not found.`);
			}
		}
		else if (!(ele instanceof HTMLElement)) {
			throw new Error('myError, The provided element is not valid.');
		}
		
		// ele is usually used with other message types, so remove the green text if any and add the red.
		ele.classList.remove('w3-text-green');
		ele.classList.add('w3-text-red');
		
		// Most error messages use the form-msg, we do not want to add the 'error' class to the form-msg
		if (ele.id !== 'form-msg') {
			ele.classList.add('error');
		}
		
		// Display the message to the element
		ele.innerHTML = msg;
		
		// If the element is hidden, show the element
		if (ele.classList.contains('w3-hide')) ele.classList.remove('w3-hide');
		
		// If there is a target, we are putting a red border around it
		if (target) {
			let targetElement = null;

			if (typeof target === 'string') {
				targetElement = document.getElementById(target);

				if (!targetElement) {
					throw new Error(`myError Target element with ID "${target}" not found.`);
				}
			}
			else if (target instanceof HTMLElement) {
				targetElement = target;
			}
			else {
				throw new Error('myError, the provided target is not valid.');
			}

			if (targetElement) {
				targetElement.classList.add('w3-border-error');
			}
		}
	}
	catch (err) {
		console.error('myError function error: ', err);
	}
}

/**
 * Displays a success message in the specified element and adds styles to indicate success.
 * 
 * @param {HTMLElement} ele - The element to display the success message.
 * @param {string} msg - The success message to display.
 * @param {string} [color='w3-text-green'] - The CSS class to apply for the success message color.
 */
export function mySuccess(ele, msg, color = 'w3-text-green') {
	try {
		// Handle the scenerio where ele may be an id string
		if (typeof ele === 'string') {
			ele = document.getElementById(ele);

			// If no element with that id, throw the error
			if (!ele) {
				throw new Error(`mySuccess Element with ID "${ele} not found.`);
			}
		}

		ele.classList.remove('w3-text-red');
		ele.classList.remove('error');
		ele.classList.add(color);
		ele.innerHTML = msg;
	}
	catch (err) {
		console.error('mySuccess function error: ', err);
	}
}

/**
 * Enables or disables a submit button based on the presence of error elements.
 * 
 * @param {HTMLElement|string} button - The button element or its ID to enable/disable.
 */
export async function disableEnableSubmitButton(button) {
	try {
		if (typeof button === 'string') {
			button = document.getElementById(button);

			if (!button) {
				throw new Error(`Submit button with ID "${button} not found.`);
			}
		}
		else if (!(button instanceof HTMLElement)) {
			throw new Error('Button is not valid.');
		}

		// Check if there are any error elements
		const errors = document.querySelectorAll('.error');
		
		button.disabled = errors.length > 0;
	}
	catch (err) {
		const { default: errorLogs } = await import("../error-messages/errorLogs.js");
		await errorLogs('disableEnableSubmitButtonError', 'Disable/Enable submit button error: ', err);
		throw err;
	}
}

/**
 * Srolls the window to the top of the page.
 */
export function top() {
	window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * @typedef {Object} BuildEleArgs
 * @property {string} type - The type of the element to create
 * @property {Object.<string, string>} [attributes] - The attributes to set on the element. Object pairs.
 * @property {string[]} [myClass] - The classes to add to the element. Array of class names.
 * @property {string} [text] - The text content of the element.
 * @param {BuildEleArgs} args - The arguments to build the element
 */
export function buildEle({ type, attributes, myClass, text }) {
	const ele = document.createElement(type);

	if (attributes) {
		for (const key in attributes) {
			ele.setAttribute(key, attributes[key]);
		}
	}
	if (myClass) {
		ele.classList.add(...myClass);
	}
	
	if (text) {
		if (typeof text === 'string' || typeof text === 'number') {
			ele.innerHTML = text;			
		}
		else if (text instanceof HTMLElement) {
			ele.appendChild(text);
		}
	}
	return ele;
}

/**
 * Sets the active tab that the user has selected.
 * Clears any messages when a new tab is selected and highlights the active tab.
 * 
 * @param {Event} evt - The event object from the clicked tab.
 * @param {Object} tabs - An object containing the list of tabs for the page.
 * @param {Element|string} msgElement - The Element Node or the string ID of the element to remove the message.
 */
export function setActiveTab(evt, tabs, msgElement) {
	// Clear any messages when the user selects a different tab
	clearMsg({ container: msgElement });

	const ele = evt.target;

	for (const tab in tabs) {
		if (evt.target.id === tabs[tab].eleId) {
			ele.nextElementSibling.classList.add('w3-blue-grey');
		} else {
			const tabEle = document.getElementById(tabs[tab].eleId);
			if (tabEle) {
				tabEle.nextElementSibling.classList.remove('w3-blue-grey');
			}
		}
	}
}