import dropDownMenu from './dropDownMenu.min.js';
import selectPage from './selectPage.min.js';

// Remove ErrorTypes import since it's now part of AppError class

const ROUTES = {
    // Dynamic (JS-managed) routes
    dynamic: {
        clients: {
            active: {
                id: ['active-client-link'],
                page: 'activeClients',
                access: 'full' // Only for full access users
            },
            inactive: {
                id: ['inactive-client-link'],
                page: 'inactiveClients',
                access: 'full'
            },
            add: {
                id: ['add-client-link'],
                page: 'addClient',
                access: 'full'
            },
            duplicate: {
                id: ['duplicate-client-link'],
                page: 'duplicateClient',
                access: 'full'
            },
            deleteDuplicate: {
                id: ['delete-duplicate-client-link'],
                page: 'deleteDuplicateClient',
                access: 'full'
            }
        },
        business: {
            mileage: {
                id: ['add-mileage-link', 'add-mileage-link-small'],
                page: 'addMileage',
                access: 'full'
            },
            expenses: {
                add: {
                    id: ['add-expenses-link', 'add-expenses-link-small'],
                    page: 'addExpenses',
                    access: 'full'
                },
                edit: {
                    id: ['edit-expenses-link', 'edit-expenses-link-small'],
                    page: 'editExpenses',
                    access: 'full'
                }
            }
        },
        notes: {
            add: {
                id: ['add-personal-notes-link', 'add-personal-notes-link-small'],
                page: 'addPersonalNotes',
                access: 'full'
            },
            edit: {
                id: ['edit-personal-notes-link', 'edit-personal-notes-link-small'],
                page: 'editPersonalNotes',
                access: 'full'
            }
        }
    },

    // Navigation controls (common to both user types)
    controls: {
        mainMenu: {
            selector: '.drop-menu',
            handler: 'dropDownMenu'
        },
        sideBar: {
            id: 'side-bar-navigation',
            handler: 'sideBarNavigation'
        }
    },

    // Static (server-rendered) routes - for reference only
    static: {
        settings: {
            dateTime: '/tracker/settings/date-time/',
            farrierPrices: '/tracker/settings/farrier-prices/',
            mileageCharges: '/tracker/settings/mileage-charges/',
            scheduleOptions: '/tracker/settings/schedule-options/',
            colorOptions: '/tracker/settings/color-options/'
        },
        reports: {
            income: '/tracker/reports/income/',
            expenses: '/tracker/reports/expenses/',
            mileage: '/tracker/reports/mileage/'
        },
        account: {
            userAccount: '/tracker/my-account/user-account/',
            dashboard: '/tracker/my-account/dashboard/',
            helpDesk: '/tracker/my-account/help-desk/'
        }
    }
};

// Define the error handling dom element
const PAGE_MSG = 'page-msg';

export default async function mainTrackerNavigation({ manageUser, manageClient }) {
    try {
        setupNavigationControls();
        await setupRouteListeners({ manageUser, manageClient });
    }
    catch (error) {
        const { AppError } = await import('../../errors/models/AppError.js');
        await AppError.process(error, {
            errorCode: AppError.Types.NAVIGATION_ERROR,
            userMessage: 'Failed to initialize navigation. Please contact support.',
            displayTarget: PAGE_MSG,
        },
            true);
    }
}

function setupNavigationControls() {
    try {
        const dropMenus = document.querySelectorAll(ROUTES.controls.mainMenu.selector);
        if (!dropMenus.length) {
            console.warn('No dropdown menus found');
        } else {
            dropMenus.forEach(el => el.addEventListener('click', dropDownMenu));
        }

        const sideBar = document.getElementById(ROUTES.controls.sideBar.id);
        if (sideBar) {
            sideBar.addEventListener('click', sideBarNavigation);
        }

        return true;
    } catch (error) {
        throw error;
    }
}

async function setupRouteListeners({ manageUser, manageClient }) {
    try {
        // Setup route handlers
        Object.values(ROUTES.dynamic).forEach(section => {
            Object.values(section).forEach(route => {
                if (route.page && route.id) {
                    route.id.forEach(id => {
                        const element = document.getElementById(id);
                        if (element) {
                            element.addEventListener('click', async (evt) => {
                                evt.preventDefault();
                                await selectPage({ evt, page: route.page, manageUser, manageClient });
                            });
                        }
                    });
                }
            });
        });
    }
    catch (error) {
        const { AppError } = await import('../../errors/models/AppError.js');
        await AppError.process(error, {
            errorCode: AppError.Types.INITIALIZATION_ERROR,
            userMessage: 'Failed to setup page navigation. Please refresh the page.',
            displayTarget: PAGE_MSG,
        });
    }
}

function sideBarNavigation() {
	const sideBar = document.getElementById('mySidebar');

	sideBar.classList.toggle('w3-hide');
}