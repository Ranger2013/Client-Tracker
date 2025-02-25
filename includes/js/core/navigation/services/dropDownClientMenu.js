export async function dropDownClientMenu(evt) {
    try {
        // Check for any manage-client button (main or nested)
        const button = evt.target.closest('[data-action="manage-client"]');
        if (!button) return;

        evt.preventDefault();
        evt.stopPropagation();

        const contentId = button.dataset.target;
        if (!contentId) return;

        // Get all dropdowns at the same level
        const parentContainer = button.closest('.w3-dropdown-content') || document;
        const siblingDropdowns = parentContainer.querySelectorAll('.w3-dropdown-content.w3-show');
        
        // Close sibling dropdowns
        siblingDropdowns.forEach(menu => {
            if (menu.id !== contentId) {
                menu.classList.remove('w3-show');
            }
        });

        // Toggle clicked dropdown
        const content = document.getElementById(contentId);
        if (content) {
            content.classList.toggle('w3-show');
        }

    } catch (err) {
        const { default: errorLogs } = await import("../../../../utils/error-messages/errorLogs.js");
        await errorLogs('dropDownClientMenuError', 'Drop down client menu error:', err);
    }
}