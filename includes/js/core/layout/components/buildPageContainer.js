import { buildEle } from '../../utils/dom/elements.js';

// Define element configurations
const PAGE_ELEMENTS = {
    container: {
        type: 'div',
        myClass: ['w3-container']
    },
    card: {
        type: 'div',
        myClass: ['w3-card'],
        attributes: { id: 'card' },
    },
    titleContainer: {
        type: 'div',
        myClass: ['w3-center']
    },
    formMsg: {
        type: 'div',
        attributes: { id: 'form-msg' }
    },
    title: {
        type: 'h5'
    },
    anchor: {
        type: 'a',
        myClass: ['w3-text-underline']
    }
};

/**
 * Builds the page container structure with optional client navigation
 * @param {Object} params - Build parameters
 * @param {string} params.pageTitle - The page title text
 * @param {string|null} [params.clientName] - Optional client name for navigation
 * @param {string|null} [params.cID] - Optional client ID
 * @param {string|null} [params.primaryKey] - Optional primary key
 * @returns {Promise<[HTMLElement, HTMLElement]>} Container and card elements
 */
export default async function buildPageContainer({ pageTitle, clientName = null, cID = null, primaryKey = null }) {
    try {
        // Build base structure
        const container = buildEle(PAGE_ELEMENTS.container);
        const card = buildEle(PAGE_ELEMENTS.card);
        const titleDiv = buildEle(PAGE_ELEMENTS.titleContainer);

        // Handle form message element
        if (!document.getElementById('form-msg')) {
            titleDiv.appendChild(buildEle(PAGE_ELEMENTS.formMsg));
        }

        // Build title with optional client link
        const title = buildEle({
            ...PAGE_ELEMENTS.title,
            text: pageTitle
        });

        if (clientName && cID && primaryKey) {
            const anchor = buildEle({
                ...PAGE_ELEMENTS.anchor,
                attributes: {
                    'data-component': 'client-navigation',  // Identifies purpose
                    'data-clientid': cID,                 // Stores client data
                    'data-primarykey': primaryKey,        // Stores key data
                    href: `/tracker/clients/appointments/?cID=${cID}&key=${primaryKey}`
                },
                text: clientName
            });

            title.appendChild(anchor);
        }

        titleDiv.appendChild(title);
        card.appendChild(titleDiv);

        return [container, card];
    } 
    catch (err) {
       const { AppError } = await import("../../errors/models/AppError.js");
       AppError.process(err, {
        errorCode: AppError.Types.RENDER_ERROR,
        userMessage: AppError.BaseMessages.system.render,
       }, true);
    }
}