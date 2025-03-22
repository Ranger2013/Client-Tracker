import { clearMsg } from '../../../../utils/dom/messages.min.js';
import { top } from '../../../../utils/window/scroll.min.js';
import { removeListeners } from '../../../../utils/dom/listeners.min.js';
import buildPageElements from './components/buildPageElements.min.js';

const COMPONENT_ID = 'schedule-list';

export default async function buildAppointmentListPage({ active, cID = null, primaryKey = null, mainContainer, manageClient, manageUser }) {
    try {
        // Initialize the page
        await initializePage(mainContainer);

        // Build the appointment page components
        const pageElements = await buildPageElements({ active, cID, primaryKey, manageClient, manageUser });
        
        // Clear the main container then append the new page contents
        mainContainer.innerHTML = '';
        mainContainer.appendChild(pageElements);

        const { default: appointmentList } = await import("../../../../../features/client/ui/schedule-list/appointmentListJS.min.js");
        await appointmentList({active, cID, primaryKey, manageClient, manageUser, mainContainer, componentId: COMPONENT_ID});

        return () => removeListeners(COMPONENT_ID);
    }
    catch(err) {
        const { AppError } = await import("../../../../errors/models/AppError.js");
        AppError.process(err, {
            errorCode: AppError.Types.RENDER_ERROR,
            userMessage: AppError.BaseMessages.system.render,
        }, true);        
    }    
}

/**
 * Initializes the page by clearing messages and scrolling to top
 * @param {HTMLElement} mainContainer - Main container element
 * @throws {Error} If mainContainer is missing
 */
async function initializePage(mainContainer) {
    try {
        clearMsg({ container: 'page-msg' });
        top();
        if (!mainContainer) {
            throw new Error('mainContainer is required');
        }
    }
    catch (err) {
        const { AppError } = await import("../../../../errors/models/AppError.js");
        AppError.process(err, {
            errorCode: AppError.Types.RENDER_ERROR,
            userMessage: null,
        }, true);
    }
}

