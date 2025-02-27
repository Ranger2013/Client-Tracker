// Store listeners by component/page ID to allow selective cleanup
const listenerMap = new Map();

/**
 * Adds an event listener with cleanup tracking
 * @param {Object} params Listener parameters
 * @param {HTMLElement|string} params.element - DOM element or element ID
 * @param {string} params.event - Event type (e.g., 'click', 'input')
 * @param {Function} params.handler - Event handler function
 * @param {string} [params.componentId='global'] - ID for grouping related listeners
 * @returns {void}
 */
export function addListener({ element, event, handler, componentId = 'global' }) {
    // Special handling for document object
    if (element === document) {
        document.addEventListener(event, handler);
        if (!listenerMap.has(componentId)) {
            listenerMap.set(componentId, []);
        }
        listenerMap.get(componentId).push({ element: document, event, handler });
        return;
    }

    // Convert string ID to element
    if (typeof element === 'string') {
        element = document.getElementById(element);
        if (!element) {
            console.warn(`Element with ID '${element}' not found`);
            return;
        }
    }

    // Validate element
    if (!(element instanceof HTMLElement)) {
        console.warn('Invalid element provided. It must be a DOM element or a valid element ID.');
        return;
    }

    // Initialize component listeners if not exists
    if (!listenerMap.has(componentId)) {
        listenerMap.set(componentId, []);
    }

    // Add listener
    element.addEventListener(event, handler);
    listenerMap.get(componentId).push({ element, event, handler });
}

export function removeListeners(componentId = 'global') {
    const listeners = listenerMap.get(componentId);
    if (!listeners) return;

    listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
    });
    
    listenerMap.delete(componentId);
}

export function removeAllListeners() {
    for (const componentId of listenerMap.keys()) {
        removeListeners(componentId);
    }
}