function closeAllMenus() {
    document.querySelectorAll('.w3-dropdown-content.w3-show').forEach(menu => {
        menu.classList.remove('w3-show');
    });
}

export function toggleClientMenu(button) {
    // First close any open menus
    const wasOpen = button.nextElementSibling.classList.contains('w3-show');
    closeAllMenus();
    
    // Then toggle the clicked menu only if it wasn't the one that was open
    if (!wasOpen) {
        button.nextElementSibling.classList.add('w3-show');
    }

    // Remove any stuck hover states on mobile
    document.body.classList.add('remove-hover');
    setTimeout(() => document.body.classList.remove('remove-hover'), 100);
}

export function handleConfirmAppointment(clientId) {
    // Handle appointment confirmation
}

export function handleClientActions(event) {
    const target = event.target;
    
    // Prevent hover state sticking on touch devices
    if (event.type === 'touchend') {
        event.preventDefault();
    }

    const actionButton = target.closest('[data-action]');
    if (!actionButton) {
        // If clicking outside menus, close all menus
        if (!target.closest('.w3-dropdown-content')) {
            closeAllMenus();
        }
        return;
    }

    const { action, clientId, primaryKey } = actionButton.dataset;

    switch (action) {
        case 'manage-client':
            event.preventDefault();
            toggleClientMenu(actionButton);
            break;
        case 'confirm-appointment':
            handleConfirmAppointment(clientId);
            break;
    }
}
