import { hasListeners, removeListeners } from "../../utils/dom/listeners.js";

/** @type {Function|null} */
let cleanup = null;
let isFromServerRenderedPage = false;

const main = document.getElementById('main');

/**
 * Handles page navigation and cleanup
 * Navigation state handling has two parts:
 * 1. closeNavigationMenu() - Handles full navigation reset including sidebar
 *    Only runs when closeMenu is false (typical navigation)
 * 2. Direct dropdown/arrow reset - Always runs to ensure clean state
 *    Needed for cases like:
 *    - Browser back/forward navigation
 *    - Internal page transitions (e.g., client detail -> list view)
 *    - Cases where we want to reset dropdowns but keep sidebar state
 * 
 * @param {Object} params Navigation parameters
 * @param {Event} params.evt - Click or popstate event
 * @param {string} params.page - Page identifier
 * @param {string|null} [params.cID] - Client ID for filtered views
 * @param {boolean|null} [params.closeMenu] - Whether to skip full menu close
 * @param {string|null} [params.primaryKey] - Record identifier
 */
export default async function selectPage({ evt, page, cID = null, closeMenu = null, primaryKey, manageUser, manageClient }) {
    evt.preventDefault();
    isFromServerRenderedPage = await checkIfCurrentPageIsServerRendered();

    // Page configuration map
    const PAGE_CONFIG = {
        clients: {
            active: {
                module: "../../layout/client/pages/schedule-list/buildAppointmentListPage.js",
                getState: () => "/tracker/clients/appointments/?active=yes",
                getArgs: () => [{ active: 'yes', mainContainer: main, manageClient, manageUser }]
            },
            inactive: {
                module: "../../layout/client/pages/schedule-list/buildAppointmentListPage.js",
                getState: () => "/tracker/clients/appointments/?active=no",
                getArgs: () => [{ active: 'no', mainContainer: main, manageClient, manageUser }]
            },
            single: {
                module: "../../layout/client/pages/schedule-list/buildAppointmentListPage.js",
                getState: (cID, primaryKey) => `/tracker/clients/appointments/?cID=${cID}&primaryKey=${primaryKey}`,
                getArgs: (cID, primaryKey) => [{ mainContainer: main, cID, primaryKey, manageClient, manageUser }]
            },
            add: {
                module: "../../layout/client/pages/add-edit-client/buildAddEditClientPage.js",
                getState: () => "/tracker/clients/add-client/",
                getArgs: (cID, primaryKey) => [{ cID, primaryKey, mainContainer: main, manageClient, manageUser }]
            },
            duplicate: {
                module: "../../layout/client/pages/duplicate-client/buildDuplicateClientPage.js",
                getState: () => "/tracker/clients/duplicate/",
                getArgs: () => [{ mainContainer: main, manageClient, manageUser }]
            },
            deleteDuplicate: {
                module: "../../layout/client/pages/delete-duplicate/buildDeleteDuplicateClientPage.js",
                getState: () => "/tracker/clients/delete-duplicate/",
                getArgs: () => [{ mainContainer: main, manageClient, manageUser }]
            }
        },
        management: {
            mileage: {
                add: {
                    module: "../../layout/user/pages/mileage/add/buildAddMileagePage.js",
                    getState: () => "/tracker/mileage/add/",
                    getArgs: () => [{ mainContainer: main, manageClient, manageUser }],
                },
            },
            expenses: {
                add: {
                    module: "../../layout/user/pages/expenses/add/buildAddExpensesPage.js",
                    getState: () => "/tracker/expenses/add/",
                    getArgs: () => [{ mainContainer: main, manageClient, manageUser }]
                },
            }
        },
        notes: {
            add: {
                module: "../../layout/user/pages/personal-notes/add/buildAddPersonalNotesPage.js",
                getState: () => "/tracker/personal-notes/add/",
                getArgs: () => [{ mainContainer: main, manageClient, manageUser }]
            },
            edit: {
                module: "../../layout/user/pages/personal-notes/edit/buildEditPersonalNotesPage.js",
                getState: () => "/tracker/personal-notes/edit/",
                getArgs: () => [{ mainContainer: main, manageClient, manageUser }]
            },
            view: {
                module: "../page-builders/pages/personal-notes/view/buildViewPersonalNotesPage.js",
                getState: () => "/tracker/personal-notes/view/",
                getArgs: () => [{ mainContainer: main }]
            }
        }
    };

    const PAGE_MAPPINGS = {
        'activeClients': { config: PAGE_CONFIG.clients.active, displayName: 'Active Clients' },
        'inactiveClients': { config: PAGE_CONFIG.clients.inactive, displayName: 'Inactive Clients' },
        'singleClient': { config: PAGE_CONFIG.clients.single, displayName: 'Single Client' },
        'addClient': { config: PAGE_CONFIG.clients.add, displayName: 'Add Client' },
        'duplicateClient': { config: PAGE_CONFIG.clients.duplicate, displayName: 'Duplicate Client' },
        'deleteDuplicateClient': { config: PAGE_CONFIG.clients.deleteDuplicate, displayName: 'Delete Duplicate Client' },
        'addMileage': { config: PAGE_CONFIG.management.mileage.add, displayName: 'Add Mileage' },
        'addExpenses': { config: PAGE_CONFIG.management.expenses.add, displayName: 'Add Expenses' },
        'editExpenses': { config: PAGE_CONFIG.management.expenses.edit, displayName: 'Edit Expenses' },
        'addPersonalNotes': { config: PAGE_CONFIG.notes.add, displayName: 'Add Personal Notes' },
        'editPersonalNotes': { config: PAGE_CONFIG.notes.edit, displayName: 'Edit Personal Notes' },
        'viewPersonalNotes': { config: PAGE_CONFIG.notes.view, displayName: 'View Personal Notes' }
    };

    try {
        // Clean up any server-rendered page listeners before SPA navigation
        if(isFromServerRenderedPage){
            await cleanupServerRenderedListeners();
        }

        // Clean up any previous SPA pages before loading new page
        await cleanupPreviousPage();

        // Conditional full navigation reset
        if (!closeMenu) closeNavigationMenu();

        // Always reset dropdown states regardless of navigation type
        const dropdowns = document.querySelectorAll('.w3-dropdown-content');
        const arrows = document.querySelectorAll('.arrow');
        dropdowns.forEach(dropdown => dropdown.classList.remove('w3-show'));
        arrows.forEach(arrow => arrow.classList.remove('up'));

        const pageMapping = PAGE_MAPPINGS[page];

        if (!pageMapping) throw new Error(`Unknown page: ${page}`);

        const { config: pageConfig, displayName } = pageMapping;

        await loadNewPage(pageConfig, page, cID, primaryKey); // Pass page here
    }
    catch (err) {
        const { displayNavigationError } = await import('../components/backupErrorPage.js');

        // Display backup page with context
        displayNavigationError({
            requestedPage: PAGE_MAPPINGS[page].displayName || page,
            errorType: err.name === 'ImportError' ? 'load' : 'build'
        });

        const { AppError } = await import("../../errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.RENDER_ERROR,
            userMessage: null,
        });
    }
}

async function cleanupPreviousPage() {
    if (cleanup) {
        console.log('Clean up Exists: ', cleanup);
        await cleanup();
        cleanup = null;
    }
}

async function loadNewPage(pageConfig, page, cID, primaryKey) {
    try {
        // Use importModule helper instead of direct import()
        const module = await importModule(pageConfig.module);

        const args = pageConfig.getArgs(cID, primaryKey);
        cleanup = await module.default(...args);

        const historyState = pageConfig.getState(cID, primaryKey);
        history.pushState({ page, isSpaNavigation: true }, '', historyState);

        // Mark that we are now in an SPA navigation state
        isFromServerRenderedPage = false;
    } catch (err) {
        console.error('Error loading page:', err);
        throw err;
    }
}

async function importModule(modulePath) {
    try {
        return await import(modulePath);
    } catch (err) {
        // Get current script path and resolve relative path
        const currentPath = '/includes/js/utils/navigation/';
        const absolutePath = new URL(modulePath, 'https://cavalierhorsemanship.com' + currentPath).pathname;

        // Try to import from the cache
        const response = await caches.match(absolutePath);

        if (!response) throw err;

        const text = await response.text();

        const blob = new Blob([text], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        try {
            const module = await import(url);
            URL.revokeObjectURL(url);
            return module;
        } catch (importErr) {
            URL.revokeObjectURL(url);
            throw importErr;
        }
    }
}

function cleanupServerRenderedListeners() {
    // Component IDs for server-rendered pages
    const SERVER_COMPONENTS = [
        'color-options',
        'farrier-prices',
        'date-time',
        'mileage-charges',
        'schedule-options',
        'tracker-install-manager',
        'user-account-page',
        'dashboard',
        'build-invoices-page',
        'build-account-settings-page',
        'unpaid-invoices-modal-listeners'
    ];

    // Only clean up components that actually have listeners
    for(const componentId of SERVER_COMPONENTS) {
        if(hasListeners(componentId)){
            console.log('Cleaning up listeners for component: ', componentId);
            removeListeners(componentId);
        }
    }
}

/**
 * Closes all navigation menus and resets their states
 * Used during page transitions to ensure clean navigation state
 * 
 * @returns {void}
 */
function closeNavigationMenu() {
    const closeNav = document.querySelectorAll('.drop-menu');
    const sideBar = document.getElementById('mySidebar');

    // Always ensure the w3-hide class is present on the sidebar
    if (sideBar && !sideBar.classList.contains('w3-hide')) {
        sideBar.classList.add('w3-hide');
    }

    // Close all dropdown menus and reset their icons
    closeNav?.forEach(nav => {
        // Close the navigation
        nav.nextElementSibling?.classList.remove('w3-show');

        const img = nav.firstElementChild;
        if (img?.classList.contains('up')) {
            img.classList.remove('up');
        }
    });
}

/**
 * Checks if the current page is server-rendered by examining the current path.
 * @returns {Promise<boolean>} - True if the current page is server-rendered, false otherwise.
 */
async function checkIfCurrentPageIsServerRendered(){
    // Check if we have history state indicating we are in SPA navigation
    if(history.state && history.state.isSpaNavigation){
        return false;
    }

    // Import the route information to get server-rendered paths
    const { ROUTES } = await import("../services/trackerAppMainNavigation.js");
    const routes = ROUTES || {};

    // Get all static routes as flat paths for comparison
    const serverPaths = [];
    if(routes.static){
        // Flatten the nexted objects into an array of paths
        Object.values(routes.static).forEach(category => {
            if(typeof category === 'object'){
                Object.values(category).forEach(path => {
                    if(typeof path === 'string'){
                        serverPaths.push(path);
                    }
                });
            }
        });
    }

    const currentPath = window.location.pathname;
    return serverPaths.some(path => currentPath.startsWith(path));
}