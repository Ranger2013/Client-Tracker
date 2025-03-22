/**
 * Toggles sidebar visibility for mobile navigation
 * @param {string} [sidebarId='mySidebar'] - ID of sidebar element
 */
export async function toggleSidebar(sidebarId = 'mySidebar') {
    try {
        const sidebar = document.getElementById(sidebarId);

        if (!sidebar) {
            throw new Error(`Sidebar element not found: ${sidebarId}`);
        }
        else {
            sidebar.classList.toggle('w3-hide');
        }
    }
    catch (error) {
        const { AppError } = await import("../../errors/models/AppError.min.js");
        AppError.handleError(error, {
            errorCode: AppError.Types.NAVIGATION_ERROR,
            userMessage: 'Navigation menu not available'
        });
    }
}