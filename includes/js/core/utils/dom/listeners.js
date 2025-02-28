import { getValidElement } from './elements.js';

/**
 * Tracks event listeners by component for cleanup
 * @type {Map<string, Set<{element: HTMLElement, type: string, listener: Function}>>}
 */
const listenerRegistry = new Map();

/**
 * Adds an event listener and tracks it by component ID
 * @param {string|HTMLElement} elementOrId - Element or element ID to attach listener to
 * @param {string} eventType - Type of event to listen for
 * @param {Function} handler - Event handler function
 * @param {string} componentId - ID for grouping related listeners
 * @throws {AppError} If element not found or listener registration fails
 */
export function addListener({elementOrId, eventType, handler, componentId}) {
    try {
        // Input validation first
        if (!elementOrId || !eventType || typeof handler !== 'function' || !componentId) {
            throw new Error(`Invalid listener parameters: elementOrId=${elementOrId}, eventType=${eventType}, hasListener=${!!handler}, componentId=${componentId}`);
        }

        // Use our utility function instead
        const element = getValidElement(elementOrId);
        
        // Add listener and track
        element.addEventListener(eventType, handler);
        registerListener(element, eventType, handler, componentId);

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
        import('../../errors/models/AppError.js')
            .then(({ AppError }) => {
                return new AppError('Event listener registration failed', {
                    originalError: error,
                    errorCode: AppError.Types.INITIALIZATION_ERROR,
                    userMessage: 'Unable to initialize component. Some features may be unavailable.',
                    shouldLog: true,
                    message: `Failed to attach ${eventType || 'unknown'} listener to ${elementDesc} for component "${componentId}"`
                }).handle();
            })
            .catch(err => console.error('Error handler failed:', err));

        return false;
    }
}

function registerListener({element, type, listener: handler, componentId}) {
    if (!listenerRegistry.has(componentId)) {
        listenerRegistry.set(componentId, new Set());
    }
    listenerRegistry.get(componentId).add({ element, type, listener: handler });
}

/**
 * Removes all listeners for a component
 * @param {string} componentId - ID of component whose listeners should be removed
 */
export function removeListeners(componentId) {
    const listeners = listenerRegistry.get(componentId);
    if (!listeners) return;

    listeners.forEach(({ element, type, listener }) => {
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