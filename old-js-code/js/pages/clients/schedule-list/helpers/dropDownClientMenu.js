export async function dropDownClientMenu(evt) {
    try {
        const button = evt.target.closest('[data-action="manage-client"]');
        if (!button) return;

        evt.preventDefault();
        evt.stopPropagation();

        const contentId = button.dataset.target;
        if (!contentId) return;

        // First close any other open menus
        const allMenus = document.querySelectorAll('.w3-dropdown-content.w3-show');
        allMenus.forEach(menu => {
            if (menu.id !== contentId) {
                menu.classList.remove('w3-show');
            }
        });

        // Toggle the clicked menu
        const content = document.getElementById(contentId);
        if (content) {
            content.classList.toggle('w3-show');
        }

    } catch (err) {
        const { default: errorLogs } = await import("../../../../utils/error-messages/errorLogs.js");
        await errorLogs('dropDownClientMenuError', 'Drop down client menu error:', err);
    }
}
