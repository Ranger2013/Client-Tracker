// DOM Elements
const main = document.getElementById('main');

let cleanup = null;

/**
 * Handles client menu page navigation and dynamically loads the necessary modules.
 * @param {Event} evt - The event object.
 * @param {string} page - The page to navigate to.
 * @param {string} cID - The client ID.
 * @param {string} primaryKey - The primary key.
 */
export default async function selectClientMenuPage(evt, page, cID, primaryKey) {
    evt.preventDefault();

    // Call the cleanup function if it exists
    if (cleanup) {
        cleanup();
        cleanup = null; // reset cleanup function
    }

    try {
        const PAGE_BUILDERS = {
            'add-trimming': {
                importPath: "../page-builders/pages/client-menu/trimming/add/buildAddTrimmingPage.js",
                importFunction: "default",
                historyState: `/tracker/trimming/add/?cID=${cID}&key=${primaryKey}`,
                args: [{cID, primaryKey, mainContainer: main}],
            },
            'view-trim-dates': {
                importPath: "../page-builders/pages/client-menu/trimming/view/buildViewTrimmingPage.js",
                importFunction: "default",
                historyState: `/tracker/trimming/view/?cID=${cID}&key=${primaryKey}`,
                args: [{cID, primaryKey, mainContainer: main}],
            },
            'edit-client': {
                importPath: "../page-builders/pages/clients/add-edit-client/buildAddEditClientPage.js",
                importFunction: "default",
                historyState: `/tracker/clients/edit-client/?cID=${cID}&key=${primaryKey}`,
                args: [{ cID, primaryKey, mainContainer: main }],
            },
            'add-horse': {
                importPath: "../page-builders/pages/client-menu/client-horses/add-horse/buildAddHorsePage.js",
                importFunction: "default",
                historyState: `/tracker/client-horses/add/?cID=${cID}&key=${primaryKey}`,
                args: [{cID, primaryKey, mainContainer: main}],
            },
            'edit-horse': {
                importPath: "../page-builders/pages/client-menu/client-horses/edit-horse/buildEditHorsePage.js",
                importFunction: "default",
                historyState: `/tracker/client-horses/edit/?cID=${cID}&key=${primaryKey}`,
                args: [{cID, primaryKey, mainContainer: main}],
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
        const { default: backupErrorPage } = await import("../error-messages/backupErrorPage.js");
		backupErrorPage();
		const { default: errorLogs } = await import('../error-messages/errorLogs.js"');
		await errorLogs('selectClientMenuPageError', 'Select Client Menu Page Error: ', err);
    }
}