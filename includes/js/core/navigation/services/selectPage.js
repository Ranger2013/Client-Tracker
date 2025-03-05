import closeNavigationMenu from "./closeNavigationMenu.js";
import { removeListeners } from "../../utils/dom/listeners.js";

/** @type {Function|null} */
let cleanup = null;
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
                add: {
                    module: "../page-builders/pages/clients/add-edit-client/buildAddEditClientPage.js",
                    getState: () => "/tracker/clients/add/",
                    getArgs: () => [{ cID, primaryKey, mainContainer: main }]
                },
                duplicate: {
                    module: "../page-builders/pages/clients/add-duplicate/buildDuplicateClientPage.js",
                    getState: () => "/tracker/clients/duplicate/",
                    getArgs: () => [{ mainContainer: main }]
                },
                deleteDuplicate: {
                    module: "../page-builders/pages/clients/delete-duplicate/buildDeleteDuplicateClientPage.js",
                    getState: () => "/tracker/clients/delete-duplicate/",
                    getArgs: () => [{ mainContainer: main }]
                }
            },
            management: {
                mileage: {
                    module: "../page-builders/pages/mileage/buildAddMileagePage.js",
                    getState: () => "/tracker/mileage/add/",
                    getArgs: () => [{ mainContainer: main }]
                },
                expenses: {
                    add: {
                        module: "../page-builders/pages/expenses/add/buildAddExpensesPage.js",
                        getState: () => "/tracker/expenses/add/",
                        getArgs: () => [{ mainContainer: main }]
                    },
                    edit: {
                        module: "../page-builders/pages/expenses/edit/buildEditExpensesPage.js",
                        getState: () => "/tracker/expenses/edit/",
                        getArgs: () => [{ mainContainer: main }]
                    }
                }
            },
            notes: {
                add: {
                    module: "../page-builders/pages/personal-notes/add/buildAddPersonalNotesPage.js",
                    getState: () => "/tracker/personal-notes/add/",
                    getArgs: () => [{ mainContainer: main }]
                },
                edit: {
                    module: "../page-builders/pages/personal-notes/edit/buildEditPersonalNotesPage.js",
                    getState: () => "/tracker/personal-notes/edit/",
                    getArgs: () => [{ mainContainer: main }]
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
            'addClient': { config: PAGE_CONFIG.clients.add, displayName: 'Add Client' },
            'duplicateClient': { config: PAGE_CONFIG.clients.duplicate, displayName: 'Duplicate Client' },
            'deleteDuplicateClient': { config: PAGE_CONFIG.clients.deleteDuplicate, displayName: 'Delete Duplicate Client' },
            'addMileage': { config: PAGE_CONFIG.management.mileage, displayName: 'Add Mileage' },
            'addExpenses': { config: PAGE_CONFIG.management.expenses.add, displayName: 'Add Expenses' },
            'editExpenses': { config: PAGE_CONFIG.management.expenses.edit, displayName: 'Edit Expenses' },
            'addPersonalNotes': { config: PAGE_CONFIG.notes.add, displayName: 'Add Personal Notes' },
            'editPersonalNotes': { config: PAGE_CONFIG.notes.edit, displayName: 'Edit Personal Notes' },
            'viewPersonalNotes': { config: PAGE_CONFIG.notes.view, displayName: 'View Personal Notes' }
        };

    try {
        // Clean up any server-rendered page listeners before SPA navigation
        cleanupServerRenderedListeners();

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
        console.log('In catch block for the display navigation error');

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
        history.pushState({ page }, '', historyState);
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
    removeListeners('color-options');       // From colorOptionsJS.js
    removeListeners('farrier-prices');      // From farrierPricesJS.js
    removeListeners('date-time');           // From dateTimeJS.js
    removeListeners('mileage-charges');     // From mileageCharges.js
    removeListeners('schedule-options');     // From scheduleOptionsJS.js
    // We'll add more as we work through other server-rendered pages
}