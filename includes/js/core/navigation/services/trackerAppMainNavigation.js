// Route definitions with metadata
const ROUTES = {
    // Client management routes
    clients: {
        active: {
            id: ['active-client-link'],
            page: 'activeClients'
        },
        inactive: {
            id: ['inactive-client-link'],
            page: 'inactiveClients'
        },
        add: {
            id: ['add-client-link'],
            page: 'addClient'
        },
        duplicate: {
            id: ['duplicate-client-link'],
            page: 'duplicateClient'
        },
        deleteDuplicate: {
            id: ['delete-duplicate-client-link'],
            page: 'deleteDuplicateClient'
        }
    },
    // Business management routes
    business: {
        mileage: {
            id: ['add-mileage-link', 'add-mileage-link-small'],
            page: 'addMileage'
        },
        expenses: {
            add: {
                id: ['add-expenses-link', 'add-expenses-link-small'],
                page: 'addExpenses'
            },
            edit: {
                id: ['edit-expenses-link', 'edit-expenses-link-small'],
                page: 'editExpenses'
            }
        }
    },
    // Notes management routes
    notes: {
        view: {
            id: ['view-personal-notes-link', 'view-personal-notes-link-small'],
            page: 'viewPersonalNotes'
        },
        add: {
            id: ['add-personal-notes-link', 'add-personal-notes-link-small'],
            page: 'addPersonalNotes'
        },
        edit: {
            id: ['edit-personal-notes-link', 'edit-personal-notes-link-small'],
            page: 'editPersonalNotes'
        }
    },
    // Navigation controls
    navigation: {
        mainMenu: {
            selector: '.drop-menu',
            handler: 'dropDownMenu'
        },
        sideBar: {
            id: ['side-bar-navigation'],
            handler: 'sideBarNavigation'
        }
    }
};

// Define the error handling dom element
const PAGE_MSG = 'page-msg';

/**
 * Sets up all navigation event listeners
 */
export default async function mainTrackerNavigation() {
    try {
        await setupNavigationControls();
        await setupRouteListeners();
    } 
    catch (err) {
        const { handleError } = await import("../../../../../old-js-code/js/utils/error-messages/handleError.js");
        await handleError({
            filename: 'mainTrackerNavigationError',
            consoleMsg: 'Navigation setup error: ',
            err: err,
            userMsg: 'Failed to initialize navigation',
            errorEle: PAGE_MSG
        });
    }
}

async function setupNavigationControls() {
    try {
        const { default: dropDownMenu } = await import("./dropDownMenu.js");
        const { default: sideBarNavigation } = await import("./sideBarNavigation.js");
        
        // Setup main menu dropdown
        const dropMenus = document.querySelectorAll(ROUTES.navigation.mainMenu.selector);
        if (!dropMenus.length) {
            throw new Error('Drop-down menu elements not found');
        }
        dropMenus.forEach(el => el.addEventListener('click', dropDownMenu));
        
        // Setup sidebar
        const sideBar = document.getElementById(ROUTES.navigation.sideBar.id[0]);
        if (!sideBar) {
            throw new Error('Sidebar element not found');
        }
        sideBar.addEventListener('click', sideBarNavigation);
    } 
    catch (err) {
        const { handleError } = await import("../../../../../old-js-code/js/utils/error-messages/handleError.js");
        await handleError({
            filename: 'setupNavigationControlsError',
            consoleMsg: 'Navigation controls setup error: ',
            err: err,
            userMsg: 'Failed to setup navigation controls',
            errorEle: PAGE_MSG
        });
    }
}

async function setupRouteListeners() {
    try {
        const { default: selectPage } = await import("./selectPage.js");

        // Setup route handlers
        Object.values(ROUTES).forEach(section => {
            Object.values(section).forEach(route => {
                if (route.page && route.id) {
                    route.id.forEach(id => {
                        const element = document.getElementById(id);
                        if (element) {
                            element.addEventListener('click', async (evt) => {
                                try {
                                    evt.preventDefault();
                                    await selectPage({ evt, page: route.page });
                                } 
                                catch (err) {
                                    const { handleError } = await import("../../../../../old-js-code/js/utils/error-messages/handleError.js");
                                    await handleError({
                                        filename: 'handleRouteClickError',
                                        consoleMsg: `Route listener error for ${route.page}: `,
                                        err: err,
                                        userMsg: 'Failed to navigate to page',
                                        errorEle: PAGE_MSG
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    } 
    catch (err) {
        const { handleError } = await import("../../../../../old-js-code/js/utils/error-messages/handleError.js");
        await handleError({
            filename: 'setupRouteListenersError',
            consoleMsg: 'Route listeners setup error: ',
            err: err,
            userMsg: 'Failed to setup page navigation',
            errorEle: PAGE_MSG
        });
    }
}