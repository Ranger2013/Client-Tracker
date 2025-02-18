
import { clearMsg } from "../../../../utils/dom/domUtils.js";
import { addListener } from "../../../../utils/event-listeners/listeners.js";
import handleByRangeFormSubmission from "../handleByRangeFormSubmission.js";
import handlePerMileFormSubmission from "../handlePerMileFormSubmission.js";
import buildByMileSection from "./buildByMileSection.js";
import listenForFuelRangeInput from "./listenForFuelRangeInput.js";

export default function handleRadioButtonSelect(range, rangeContainer, mile, mileContainer, buttonContainer) {
	const clicks = {
		byRange: {
			radio: range,
			container: rangeContainer,
			listenFor: 'by-range-form',
			formFunction: handleByRangeFormSubmission, // The form submission function
		},
		byMile: {
			radio: mile,
			container: mileContainer,
			listenFor: 'per-mile-form',
			formFunction: handlePerMileFormSubmission, // The form submission function
		},
	};

	// Toggle the containers based on the radio button selected
	for (const click in clicks) {
		// Handle showing the containers
		addListener(clicks[click].radio, 'click', () => {
			toggleContainers(clicks[click].container, clicks, buttonContainer);
		});

		// Handle the form submissions
		addListener(clicks[click].listenFor, 'submit', clicks[click].formFunction); // Add the listener for the form submissions
	}
}

async function toggleContainers(eleContainer, clicks, buttonContainer) {
	try {
		// Clear any messages
		clearMsg({ container: document.getElementById('form-msg') });

		// Hide all the containers first
		hideContainers(clicks);

		const containerMapping = {
			byMileContainer: {
				id: 'by-mile-container',
				action: async () => await buildByMileSection(buttonContainer), // The functions to build the different sections
			},
			byRangeContainer: {
				id: 'by-range-container',
				action: listenForFuelRangeInput, // The functions to build the different sections
			},
		};

		for (const container in containerMapping) {
			// Make sure we have the correct section
			if (containerMapping[container].id === eleContainer.id) {
				containerMapping[container].action(); // Execute the function to show the page
				eleContainer.classList.toggle('w3-hide');
				break;
			}
		}
	}
	catch (err) {
		console.warn('toggle containers error: ', err);
	}
}

// Hide all the containers on the page
function hideContainers(clicks) {
	for (const key in clicks) {
		clicks[key].container.classList.add('w3-hide');
	}
}