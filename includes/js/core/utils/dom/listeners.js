import { getValidElement } from './elements.min.js';

/**
 * Tracks event listeners by component for cleanup
 * @type {Map<string, Set<{element: HTMLElement, type: keyof HTMLElementEventMap, listener: EventListener}>>}
 */
const listenerRegistry = new Map();

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
export function addListener({elementOrId, eventType, handler, componentId}) {
    try {
        // Input validation first
        if (!elementOrId || !eventType || typeof handler !== 'function' || !componentId) {
            throw new Error(`Invalid listener parameters: elementOrId=${elementOrId}, eventType=${eventType}, hasListener=${!!handler}, componentId=${componentId}`);
        }

        // Use our utility function instead
        const element = getValidElement(elementOrId);

        // Normalize eventType to always be an array
        const eventTypes = Array.isArray(eventType) ? eventType : [eventType];

        // Process all event types in a single loop
        eventTypes.forEach(type => {
            element.addEventListener(type, handler);
            registerListener({element, type, listener: handler, componentId});
        });

        return true;
    }
    catch (error) {
        const elementDesc = typeof elementOrId === 'string' 
            ? `element with ID "${elementOrId}"` 
            : (elementOrId?.id ? `element with ID "${elementOrId.id}"` : 'element (no ID)');

        // Keep error handling synchronous for immediate feedback
        console.error('Listener registration failed:', {
            element: elementDesc,
            event: eventType,
            component: componentId,
            error
        });

        // Handle error asynchronously
        import('../../errors/models/AppError.min.js')
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
function registerListener({element, type, listener, componentId}) {
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
    const listeners = listenerRegistry.get(componentId);
    if (!listeners) return;

    listeners.forEach(({ element, type, listener }) => {
        // Type assertion to handle the strict typing
        element.removeEventListener(type, listener);
    });

    listenerRegistry.delete(componentId);
}

/**
 * Checks if a component has registered listeners
 * @param {string} componentId - Component ID to check
 * @returns {boolean} True if component has listeners
 */
export function hasListeners(componentId) {
    return listenerRegistry.has(componentId) &&
        listenerRegistry.get(componentId).size > 0;
}

/**
 * Removes all listeners for all components
 */
export function removeAllListeners() {
    for (const componentId of listenerRegistry.keys()) {
        removeListeners(componentId);
    }
}