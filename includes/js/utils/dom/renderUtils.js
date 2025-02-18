/**
 * Generic page rendering utility
 * @param {HTMLElement} mainContainer Main container element
 * @param {Object} elements Page elements to render
 * @param {Object} config Rendering configuration
 * @param {string[]} config.renderOrder Order of elements to render
 * @param {HTMLElement} [config.targetContainer] Optional container to render into
 * @param {Function} [config.beforeRender] Hook called before rendering
 * @param {Function} [config.afterRender] Hook called after rendering
 */
export async function renderPage(mainContainer, elements, config) {
    try {
        const {
            renderOrder,
            targetContainer = mainContainer,
            beforeRender,
            afterRender
        } = config;

        // Clear main container
        mainContainer.innerHTML = '';

        // Pre-render hook
        if (beforeRender) beforeRender(targetContainer);

        // Render elements in specified order
        renderOrder.forEach(key => {
            const element = elements[key];
            if (element) targetContainer.appendChild(element);
        });

        // If using a different target container, append it to main
        if (targetContainer !== mainContainer) {
            mainContainer.appendChild(targetContainer);
        }

        // Post-render hook
        if (afterRender) afterRender(targetContainer);

    } catch (err) {
        const { handleError } = await import("../error-messages/handleError.js");
        await handleError(
            'renderPageError',
            'Error rendering page:',
            err,
            'Unable to render page elements.',
            'page-msg'
        );
    }
}

// Page-specific configs
export const renderConfigs = {
    clientList: {
        renderOrder: ['formMsg', 'searchBlock', 'clientList'],
        container: true,
        beforeRender: (container) => {
            // Client list specific setup
        }
    },
    addHorse: {
        renderOrder: ['formMsg', 'form'],
        container: true
    }
};
