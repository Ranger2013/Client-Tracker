import { getValidElement } from './elements.js';

/**
 * Tracks event listeners by component for cleanup
 * @type {Map<string, Set<{element: HTMLElement, type: keyof HTMLElementEventMap, listener: EventListener}>>}
 */
const REGISTRY_KEY = 'APP_LISTENER_REGISTRY';
if (!window[REGISTRY_KEY]) {
    window[REGISTRY_KEY] = new Map();
}

const listenerRegistry = window[REGISTRY_KEY];

/**
 * Adds an event listener and tracks it by component ID
 * @param {Object} options - The listener options
 * @param {string|HTMLElement} options.elementOrId - Element or element ID to attach listener to
 * @param {string|string[]} options.eventType - Type of event to listen for
 * @param {EventListener} options.handler - Event handler function
 * @param {string} options.componentId - ID for grouping related listeners
 * @throws {AppError} If element not found or listener registration fails
 * @returns {boolean} True if listener was added successfully
 */
export function addListener({ elementOrId, eventType, handler, componentId }) {
    try {
        // Input validation first
        if (!elementOrId || !eventType || typeof handler !== 'function' || !componentId) {
            throw new Error(`Invalid listener parameters: elementOrId=${elementOrId}, eventType=${eventType}, hasListener=${!!handler}, componentId=${componentId}`);
        }

        // Use our utility function instead
        // const element = getValidElement(elementOrId);
        let element;

        // Special case for window and document objects
        if (elementOrId === window || elementOrId === document) {
            element = elementOrId;
        }
        else {
            element = getValidElement(elementOrId);
        }

        // Normalize eventType to always be an array
        const eventTypes = Array.isArray(eventType) ? eventType : [eventType];

        // Process all event types in a single loop
        eventTypes.forEach(type => {
            element.addEventListener(type, handler);
            registerListener({ element, type, listener: handler, componentId });
        });

        return true;
    }
    catch (error) {
        let elementDesc;

        if (elementOrId === window) {
            elementDesc = 'window object';
        }
        else if (elementOrId === document) {
            elementDesc = 'document object';
        }
        else {
            elementDesc = typeof elementOrId === 'string'
                ? `element with ID "${elementOrId}"`
                : (elementOrId?.id ? `element with ID "${elementOrId.id}"` : 'element (no ID)');
        }

        // Keep error handling synchronous for immediate feedback
        console.error('Listener registration failed:', {
            element: elementDesc,
            event: eventType,
            component: componentId,
            error
        });

        // Handle error asynchronously
        import('../../errors/models/AppError.js')
            .then(({ AppError }) => {
                return AppError.handleError(error, {
                    errorCode: AppError.Types.INITIALIZATION_ERROR,
                    userMessage: 'Unable to initialize component. Some features may be unavailable.',
                });
            })
            .catch(err => console.error('Error handler failed:', err));

        return false;
    }
}

/**
 * @param {Object} options - Registration options
 * @param {HTMLElement} options.element - DOM element
 * @param {keyof HTMLElementEventMap} options.type - Event type
 * @param {EventListener} options.listener - Event handler
 * @param {string} options.componentId - Component identifier
 */
function registerListener({ element, type, listener, componentId }) {
    if (!listenerRegistry.has(componentId)) {
        listenerRegistry.set(componentId, new Set());
    }
    listenerRegistry.get(componentId).add({ element, type, listener });
}

/**
 * Removes all listeners for a component
 * @param {string} componentId - ID of component whose listeners should be removed
 */
export function removeListeners(componentId) {
    const registry = window[REGISTRY_KEY];

    if (!registry) {
        console.error('CRITICAL ERROR: Global listener registry  not found!');
        return;
    }


    const listeners = registry.get(componentId);
    if (!listeners) {
        return;
    };

    // Create a copy to avoid modification during iteration
    const listenerCopy = Array.from(listeners);
    listenerCopy.forEach(({ element, type, listener }) => {
        try {
            element.removeEventListener(type, listener);
        }
        catch (err) {
            console.error(`Error removing listener for ${componentId}: `, err);
        }

        registry.delete(componentId);
    });
}

/**
 * Checks if a component has registered listeners
 * @param {string} componentId - Component ID to check
 * @returns {boolean} True if component has listeners
 */
export function hasListeners(componentId) {
    const registry = window[REGISTRY_KEY];
    if (!registry) return false;

    return registry.has(componentId) && registry.get(componentId).size > 0;
}

/**
 * Removes all listeners for all components
 */
export function removeAllListeners() {
    for (const componentId of listenerRegistry.keys()) {
        removeListeners(componentId);
    }
}