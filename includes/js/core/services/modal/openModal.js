import { buildEle, getValidElement } from "../../utils/dom/elements.js";
import { addListener, removeListeners } from "../../utils/dom/listeners.js";

// Set up debug mode
const COMPONENT = 'Modal';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(COMPONENT, ...args);
	}
};

// DOM Elements
const modal = getValidElement('modal');
const modalContent = getValidElement('modal-content');

// Default component ID for internal modal controls
const DEFAULT_MODAL_COMPONENT_ID = 'modal-system';

/**
 * Opens a modal window with the specified content, title, and configuration.
 *
 * @param {Object} options - The options for the modal.
 * @param {string|Node} options.content - The content to be displayed in the modal. Can be a string or a DOM node.
 * @param {string|null} [options.title=null] - The title of the modal. If null, no title section will be added.
 * @param {Array<string>} [options.configuration=[]] - An array of CSS class names to apply to the modal content container.
 * @param {string} [options.componentId=DEFAULT_MODAL_COMPONENT_ID] - The component ID for event listener cleanup.
 *
 * @example
 * // Open a modal with text content
 * openModal({
 *   content: 'This is the modal content',
 *   title: 'Modal Title',
 *   configuration: ['custom-class1', 'custom-class2']
 * });
 *
 * @example
 * // Open a modal with a DOM node as content
 * const contentNode = document.createElement('div');
 * contentNode.textContent = 'This is the modal content';
 * openModal({
 *   content: contentNode,
 *   title: 'Modal Title',
 *   configuration: ['custom-class1', 'custom-class2']
 * });
 */
export default function openModal({ content, title = null, configuration = [], componentId = DEFAULT_MODAL_COMPONENT_ID }) {
	try {
		// First clean up any existing modal listeners to prevent duplicates
		removeListeners(componentId);

		 // Clear any previous nodes
		 modalContent.innerHTML = '';

		 // Build the close modal section
		 const closeModalEle = buildCloseModalSection(componentId);
		 modalContent.appendChild(closeModalEle);

		 if (title) {
			  // Build the title section
			  const modalTitleEle = buildModalTitle(title);
			  modalContent.appendChild(modalTitleEle);
		 }

		 // Set up the configuration for the modal
		 if (configuration.length === 0) {
			  configuration = [
					'w3-padding',
					'w3-round-large',
					'w3-white',
					// 'w3-margin',
					'w3-margin-center'
			  ];
		 }

		 modalContent.classList.add(...configuration);
		 debugLog('content typeof: ', typeof content);
		 debugLog('content: ', content);
		 if (typeof content === 'string') {
			  // Append the string content safely
			  modalContent.insertAdjacentHTML('beforeend', content);
		 }
		 else if (content instanceof Node) {
			  modalContent.appendChild(content);
		 }

		 // Display the modal
		 modal.classList.toggle('w3-hide');
	}
	catch (err) {
		 console.warn('Error with the open modal function: ', err);
	}
}

function buildCloseModalSection(componentId) {
	const div = buildEle({
		type: 'div',
		attributes: { id: 'close-the-modal' }
	});

	const closeSpan = buildEle({
		type: 'span',
		attributes: {
			id: 'close-modal',
		},
		myClass: ['w3-text-red', 'w3-pointer'],
		text: 'Close - X'
	});

	div.appendChild(closeSpan);

	addListener({
		elementOrId: closeSpan,
		eventType: 'click', 
		handler: () => closeModal(componentId),
		componentId,
	});

	return div;
}

function buildModalTitle(title) {
	// Build the title container
	const titleContainer = buildEle({
		type: 'div',
		myClass: ['w3-padding-small', 'w3-center'],
	});

	const titleHeader = buildEle({
		type: 'h5',
		text: title,
	});

	titleContainer.appendChild(titleHeader);

	return titleContainer;
}

export function closeModal(componentId = DEFAULT_MODAL_COMPONENT_ID) {
	// Clear the modal content
	modalContent.innerHTML = '';

	// Clean up any listeners associated with this modal instance
	removeListeners(componentId);

	// Hide the mdoal. Modal has css handling it's display property
	modal.classList.toggle('w3-hide');
}

/**
 * Scrolls the modal to the top.
 */
export function topOfModal() {
	modal.scrollTo({ top: 0, behavior: 'smooth' });
}

