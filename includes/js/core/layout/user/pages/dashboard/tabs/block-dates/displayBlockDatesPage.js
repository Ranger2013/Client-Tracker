import { getValidElement } from '../../../../../../utils/dom/elements.js';
import { Calendar } from '../../../../../../../features/user/services/Calendar.js';

export default async function displayBlockDatesPage({ evt, messageContainer, tabContainer, manageUser, componentId }) {
    try {
        // Validate container first
        const validContainer = getValidElement(tabContainer);
        
        const calendar = new Calendar({ 
            manageUser, 
            componentId,  // Pass componentId to Calendar
            messageContainer 
        });
        
        const calendarElement = await calendar.initialize();
        
        // Clear and append
        validContainer.innerHTML = '';
        validContainer.appendChild(calendarElement);

        // Now that elements exist in DOM, setup listeners
        await calendar.setupListeners();
        
    } catch (err) {
        const { AppError } = await import("../../../../../../errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.RENDER_ERROR,
            message: AppError.BaseMessages.system.render,
        });
    }
}
