// DOM Elements
const main = document.getElementById('main');

let cleanup = null;

const PAGE_MAPPINGS = {
    'add-trimming': { displayName: 'Add Trimming/Shoeing' },
    'view-trim-dates': { displayName: 'View Trim Dates' },
    'edit-client': { displayName: 'Edit Client' },
    'add-horse': { displayName: 'Add Horse' },
    'edit-horse': { displayName: 'Edit Horse' }
};

/**
 * Handles client menu page navigation and dynamically loads the necessary modules.
 * @param {Object} params Navigation parameters
 * @param {Event} params.evt - The event object
 * @param {string} params.page - The page to navigate to
 * @param {string} params.cID - The client ID
 * @param {string} params.primaryKey - The primary key
 * @param {Object} params.manageClient - Client management functions
 * @param {Object} params.manageUser - User management functions
 * @param {HTMLElement} params.mainContainer - Main container element
 */
export default async function selectClientMenuPage({ evt, page, cID, primaryKey, manageClient, manageUser, mainContainer }) {
    evt.preventDefault();

    // Call the cleanup function if it exists
    if (cleanup) {
        cleanup();
        cleanup = null; // reset cleanup function
    }

    try {
        const PAGE_BUILDERS = {
            'add-trimming': {
                importPath: "../../layout/client/menu/trimming/add/buildAddTrimmingPage.js",
                importFunction: "default",
                historyState: `/tracker/trimming/add/?cID=${cID}&key=${primaryKey}`,
                args: [{ cID, primaryKey, mainContainer: main, manageClient, manageUser }],
            },
            'view-trim-dates': {
                importPath: "../../layout/client/menu/trimming/view/buildViewTrimmingPage.js",
                importFunction: "default",
                historyState: `/tracker/trimming/view/?cID=${cID}&key=${primaryKey}`,
                args: [{ cID, primaryKey, mainContainer: main, manageClient, manageUser }],
            },
            'edit-client': {
                importPath: "../../layout/client/pages/add-edit-client/buildAddEditClientPage.js",
                importFunction: "default",
                historyState: `/tracker/clients/edit-client/?cID=${cID}&key=${primaryKey}`,
                args: [{ cID, primaryKey, mainContainer: main, manageClient, manageUser }],
            },
            'add-horse': {
                importPath: "../../layout/client/menu/horses/add/buildAddHorsePage.js",
                importFunction: "default",
                historyState: `/tracker/client-horses/add/?cID=${cID}&key=${primaryKey}`,
                args: [{ cID, primaryKey, mainContainer: main, manageClient, manageUser }],
            },
            'edit-horse': {
                importPath: "../../layout/client/menu/horses/edit/buildEditHorsePage.js",
                importFunction: "default",
                historyState: `/tracker/client-horses/edit/?cID=${cID}&key=${primaryKey}`,
                args: [{ cID, primaryKey, mainContainer: main, manageClient, manageUser }],
            },
        };

        const pageBuilder = PAGE_BUILDERS[page];

        if (!pageBuilder) {
            throw new Error(`Page builder not found for page: ${page}`);
        }

        const module = await import(pageBuilder.importPath);
        const buildFunction = module[pageBuilder.importFunction];

        cleanup = await buildFunction(...pageBuilder.args);

        history.pushState({ page }, '', pageBuilder.historyState);
    }
    catch (err) {
        const { displayNavigationError } = await import('../components/backupErrorPage.js');

        // Display backup page with context
        displayNavigationError({
            requestedPage: PAGE_MAPPINGS[page]?.displayName || page,
            errorType: err.name === 'ImportError' ? 'load' : 'build'
        });

        const { AppError } = await import("../../errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.RENDER_ERROR,
            userMessage: `Unable to load ${PAGE_MAPPINGS[page]?.displayName || 'requested'} page.`,
        });
    }
}