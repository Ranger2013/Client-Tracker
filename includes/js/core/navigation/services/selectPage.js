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
export default async function selectPage({ evt, page, cID = null, closeMenu = null, primaryKey }) {
    evt.preventDefault();
    try {
        // Clean up any server-rendered page listeners before SPA navigation
        cleanupServerRenderedListeners();

        // Page configuration map
        const PAGE_CONFIG = {
            clients: {
                active: {
                    module: "../page-builders/pages/clients/schedule-list/buildScheduleListPage.js",
                    getState: () => "/tracker/clients/appointments/?active=yes",
                    getArgs: () => [{ active: 'yes', mainContainer: main }]
                },
                inactive: {
                    module: "../page-builders/pages/clients/schedule-list/buildScheduleListPage.js",
                    getState: () => "/tracker/clients/appointments/?active=no",
                    getArgs: () => [{ active: 'no', mainContainer: main }]
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
            'activeClients': PAGE_CONFIG.clients.active,
            'inactiveClients': PAGE_CONFIG.clients.inactive,
            'addClient': PAGE_CONFIG.clients.add,
            'duplicateClient': PAGE_CONFIG.clients.duplicate,
            'deleteDuplicateClient': PAGE_CONFIG.clients.deleteDuplicate,
            'addMileage': PAGE_CONFIG.management.mileage,
            'addExpenses': PAGE_CONFIG.management.expenses.add,
            'editExpenses': PAGE_CONFIG.management.expenses.edit,
            'addPersonalNotes': PAGE_CONFIG.notes.add,
            'editPersonalNotes': PAGE_CONFIG.notes.edit,
            'viewPersonalNotes': PAGE_CONFIG.notes.view
        };

        await cleanupPreviousPage();

        // Conditional full navigation reset
        if (!closeMenu) closeNavigationMenu();

        // Always reset dropdown states regardless of navigation type
        const dropdowns = document.querySelectorAll('.w3-dropdown-content');
        const arrows = document.querySelectorAll('.arrow');
        dropdowns.forEach(dropdown => dropdown.classList.remove('w3-show'));
        arrows.forEach(arrow => arrow.classList.remove('up'));

        const pageConfig = PAGE_MAPPINGS[page];

        if (!pageConfig) throw new Error(`Unknown page: ${page}`);

        await loadNewPage(pageConfig, page, cID, primaryKey); // Pass page here

    } catch (err) {
        const { displayNavigationError } = await import('../components/backupErrorPage.js');
        
        // Log the error but handle display separately
        const { errorLogs } = await import('../../errors/services/errorLogs.js');
        await errorLogs('selectPageError', `Navigation failed for page: ${page}`, err);

        // Display backup page with context
        displayNavigationError({
            requestedPage: page,
            errorType: err.name === 'ImportError' ? 'load' : 'build'
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

async function handlePageError(err) {
    const { default: backupErrorPage } = await import("../../../../../old-js-code/js/utils/error-messages/backupErrorPage.js");
    const { default: errorLogs } = await import('../../../../../old-js-code/js/utils/error-messages/errorLogs.js');

    backupErrorPage();
    await errorLogs('selectPageError', 'Select Page Error: ', err);
}

function cleanupServerRenderedListeners() {
    removeListeners('color-options');       // From colorOptionsJS.js
    removeListeners('farrier-prices');      // From farrierPricesJS.js
    removeListeners('date-time');           // From dateTimeJS.js
    removeListeners('mileage-charges');     // From mileageCharges.js
    removeListeners('schedule-options');     // From scheduleOptionsJS.js
    // We'll add more as we work through other server-rendered pages
}