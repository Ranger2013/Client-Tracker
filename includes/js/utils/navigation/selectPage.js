import closeNavigationMenu from "./closeNavigationMenu.js";

/** @type {Function|null} */
let cleanup = null;
const main = document.getElementById('main');


/**
 * Handles page navigation and cleanup
 * @param {Object} params Navigation parameters
 */
export default async function selectPage({ evt, page, cID = null, closeMenu = null, primaryKey }) {
    evt.preventDefault();

    try {
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
        if (!closeMenu) closeNavigationMenu();

        // Reset all dropdown menus and arrows
        const dropdowns = document.querySelectorAll('.w3-dropdown-content');
        const arrows = document.querySelectorAll('.arrow');

        dropdowns.forEach(dropdown => dropdown.classList.remove('w3-show'));
        arrows.forEach(arrow => arrow.classList.remove('up'));

        const pageConfig = PAGE_MAPPINGS[page];
        if (!pageConfig) throw new Error(`Unknown page: ${page}`);

        await loadNewPage(pageConfig, page, cID, primaryKey); // Pass page here

    } catch (err) {
        await handlePageError(err);
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
        console.log('In importModule: catch block: err: ', err);
        console.log('In importModule: catch block: modulePath: ', modulePath);

        // Get current script path and resolve relative path
        const currentPath = '/includes/js/utils/navigation/';
        const absolutePath = new URL(modulePath, 'https://cavalierhorsemanship.com' + currentPath).pathname;

        console.log('Attempting absolute path:', absolutePath);

        const response = await caches.match(absolutePath);
        if (!response) throw err;
        console.log('In importModule: catch block: response: ', response);

        const text = await response.text();
        console.log('In importModule: catch block: text: ', text);

        const blob = new Blob([text], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        console.log('In importModule: catch block: url: ', url);

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
    const { default: backupErrorPage } = await import("../error-messages/backupErrorPage.js");
    const { default: errorLogs } = await import('../error-messages/errorLogs.js');

    backupErrorPage();
    await errorLogs('selectPageError', 'Select Page Error: ', err);
}