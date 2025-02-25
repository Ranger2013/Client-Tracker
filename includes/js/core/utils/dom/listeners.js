// Store listeners by component/page ID to allow selective cleanup
const listenerMap = new Map();

export function addListener(element, event, handler, componentId = 'global') {
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