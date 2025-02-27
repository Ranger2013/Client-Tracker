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
 * @param {Function} listener - Event handler function
 * @param {string} componentId - ID for grouping related listeners
 * @throws {AppError} If element not found or listener registration fails
 */
export function addListener(elementOrId, eventType, listener, componentId) {
    try {
        // Input validation first
        if (!eventType || typeof listener !== 'function' || !componentId) {
            throw new Error(`Invalid listener parameters: eventType=${eventType}, hasListener=${!!listener}, componentId=${componentId}`);
        }

        // Use our utility function instead
        const element = getValidElement(elementOrId);

        // Add listener
        element.addEventListener(eventType, listener);

        // Track for cleanup
        if (!listenerRegistry.has(componentId)) {
            listenerRegistry.set(componentId, new Set());
        }

        listenerRegistry.get(componentId).add({
            element,
            type: eventType,
            listener
        });

    }
    catch (error) {
        const elementDesc = typeof elementOrId === 'string'
            ? `element with ID "${elementOrId}"`
            : `element ${elementOrId?.id ? `with ID "${elementOrId.id}"` : '(no ID)'}`;

        import('../../errors/models/AppError.js')
            .then(({ AppError }) => {
                const appError = new AppError(`Failed to attach ${eventType} listener`, {
                    originalError: error,
                    errorCode: AppError.Types.INITIALIZATION_ERROR,
                    userMessage: AppError.Messages.system.initialization,
                    shouldLog: true,
                    // Add diagnostic info to the technical message
                    message: `Failed to attach ${eventType} listener to ${elementDesc} for component "${componentId}"`
                });
                return appError.handle();
            })
            .catch(err => {
                console.error('Listener registration failed:', {
                    element: elementDesc,
                    event: eventType,
                    component: componentId,
                    error: error,
                    handlingError: err
                });
            });

        return false;
    }

    return true;
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