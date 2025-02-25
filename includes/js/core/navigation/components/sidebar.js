/**
 * Toggles sidebar visibility for mobile navigation
 * @param {string} [sidebarId='mySidebar'] - ID of sidebar element
 */
export async function toggleSidebar(sidebarId = 'mySidebar') 
{
    try 
    {
        const sidebar = document.getElementById(sidebarId);
        
        if (!sidebar) 
        {
            const { AppError } = await import('../../errors/AppError.js');
            const { ErrorTypes } = await import('../../errors/errorTypes.js');
            
            throw new AppError(`Sidebar element not found: ${sidebarId}`, {
                errorCode: ErrorTypes.NAVIGATION_ERROR,
                userMessage: 'Navigation menu not available',
                displayTarget: 'page-msg'
            });
        }
        else 
        {
            sidebar.classList.toggle('w3-hide');
        }
    } 
    catch (error) 
    {
        const { handleError } = await import('../../errors/errorHandler.js');
        // UI function, no need to rethrow
        await handleError(error, false);
    }
}