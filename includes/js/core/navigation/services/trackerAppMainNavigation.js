import selectPage from './selectPage.js';

const menuState = {
    closeAll(except = null) {
        // Close the sidebar
        const sideBar = document.getElementById('mySidebar');
        if (sideBar && except !== 'sidebar') {
            sideBar.classList.add('w3-hide');
        }

        // Close all other dropdowns
        const dropDowns = document.querySelectorAll('.w3-dropdown-content');
        const arrows = document.querySelectorAll('.arrow');
        if (except !== 'dropdowns') {
            dropDowns.forEach(dropdown => dropdown.classList.remove('w3-show'));
            arrows.forEach(arrow => arrow.classList.remove('up'));
        }
    }
};


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
        // Handles opening and closing dropdown menus
        setupNavigationControls();

        // Handels page navigation for spa pages
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

async function setupRouteListeners({ manageUser, manageClient }) {
    try {
        // Recursive function to process routes at any nesting level
        function processRoutes(routeObject) {
            Object.entries(routeObject).forEach(([key, item]) => {
                // Check if this item is a route (has page and id)
                if (item.page && item.id) {
                    // It's a route - attach listeners
                    item.id.forEach(id => {
                        const element = document.getElementById(id);
                        if (element) {
                            element.addEventListener('click', async (evt) => {
                                evt.preventDefault();
                                await selectPage({ evt, page: item.page, manageUser, manageClient });
                            });
                        }
                    });
                }
                // If it's not a route but an object, process recursively
                else if (typeof item === 'object') {
                    processRoutes(item);
                }
            });
        }

        // Start processing from the top level
        processRoutes(ROUTES.dynamic);
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

// function setupNavigationControls() {
//     try {
//         const dropMenus = document.querySelectorAll(ROUTES.controls.mainMenu.selector);
//         if (!dropMenus.length) {
//             console.warn('No dropdown menus found');
//         } else {
//             dropMenus.forEach(el => el.addEventListener('click', dropDownMenu));
//         }

//         const sideBar = document.getElementById(ROUTES.controls.sideBar.id);
//         if (sideBar) {
//             sideBar.addEventListener('click', sideBarNavigation);
//         }

//         return true;
//     } catch (error) {
//         throw error;
//     }
// }

// function sideBarNavigation() {
//     // menuState.closeAll('sidebar');
//     const sideBar = document.getElementById('mySidebar');
//     sideBar.classList.toggle('w3-hide');
// }

// function dropDownMenu(evt) {
//     evt.preventDefault();

//     // Get the clicked dropdown trigger
//     const trigger = evt.target.closest('.drop-menu');
//     if (!trigger) return;

//     // Get the dropdown ID to toggle
//     const contentId = trigger.dataset.target;
//     if (!contentId) return;

//     // RELIABLE way to detect if we're in the sidebar - no data attributes needed
//     const isInSidebar = !!trigger.closest('#mySidebar');

//     // If in main navigation
//     if (!isInSidebar) {
//         // 1. Close sidebar if open
//         const sideBar = document.getElementById('mySidebar');
//         if (sideBar && !sideBar.classList.contains('w3-hide')) {
//             sideBar.classList.add('w3-hide');
//         }

//         // 2. Close all dropdown menus in main nav (except the one we're toggling)
//         document.querySelectorAll('.w3-dropdown-content').forEach(dropdownContent => {
//             if (dropdownContent.id !== contentId && !dropdownContent.closest('#mySidebar')) {
//                 dropdownContent.classList.remove('w3-show');
//             }
//         });

//         // 3. Reset all arrows in main nav (except the one we're toggling)
//         document.querySelectorAll('.arrow').forEach(arrow => {
//             const parentTrigger = arrow.closest('.drop-menu');
//             if (parentTrigger && parentTrigger.dataset.target !== contentId && !parentTrigger.closest('#mySidebar')) {
//                 arrow.classList.remove('up');
//             }
//         });
//     } 
//     // If in sidebar
//     else {
//         // Only close other sidebar dropdowns
//         document.querySelectorAll('#mySidebar .w3-dropdown-content').forEach(dropdownContent => {
//             if (dropdownContent.id !== contentId) {
//                 dropdownContent.classList.remove('w3-show');
//             }
//         });

//         // Reset other sidebar arrows
//         document.querySelectorAll('#mySidebar .arrow').forEach(arrow => {
//             const parentTrigger = arrow.closest('.drop-menu');
//             if (parentTrigger && parentTrigger.dataset.target !== contentId) {
//                 arrow.classList.remove('up');
//             }
//         });
//     }

//     // Toggle the clicked dropdown
//     const content = document.getElementById(contentId);
//     const arrow = trigger.querySelector('.arrow');

//     if (content && arrow) {
//         content.classList.toggle('w3-show');
//         arrow.classList.toggle('up');
//     }
// }

function setupNavigationControls() {
    try {
        // Get the navigation container
        const navContainer = document.getElementById('navigation');
        if (!navContainer) {
            console.warn('Navigation container not found');
            return false;
        }

        // Set up a single event listener for navigation
        navContainer.addEventListener('click', handleNavigationClick);
        return true;
    } catch (error) {
        throw error;
    }
}

// Navigation action handlers - structured like your expensesJS approach
const navHandlers = {
    // Sidebar toggle handler
    'sidebar': () => {
        // Close all main navigation dropdowns
        document.querySelectorAll('.w3-dropdown-content:not(#mySidebar .w3-dropdown-content)').forEach(dropdown => {
            dropdown.classList.remove('w3-show');
        });

        document.querySelectorAll('.arrow:not(#mySidebar .arrow)').forEach(arrow => {
            arrow.classList.remove('up');
        });

        // Toggle sidebar
        const sideBar = document.getElementById('mySidebar');
        sideBar.classList.toggle('w3-hide');
    },

    // Main navigation dropdown handler
    'mainDropdown': (element) => {
        const contentId = element.dataset.target;

        // Close sidebar
        const sideBar = document.getElementById('mySidebar');
        if (sideBar && !sideBar.classList.contains('w3-hide')) {
            sideBar.classList.add('w3-hide');

            // Reset all sidebar dropdowns
            document.querySelectorAll('#mySidebar [id^="dropSm"]').forEach(dropdown => {
                dropdown.classList.remove('w3-show');
                dropdown.classList.add('w3-hide');
            });
        }

        // Close other main dropdowns
        document.querySelectorAll('.w3-dropdown-content:not(#mySidebar .w3-dropdown-content)').forEach(dropdown => {
            if (dropdown.id !== contentId) {
                dropdown.classList.remove('w3-show');
            }
        });

        document.querySelectorAll('.arrow:not(#mySidebar .arrow)').forEach(arrow => {
            const parent = arrow.closest('.drop-menu');
            if (parent && parent.dataset.target !== contentId) {
                arrow.classList.remove('up');
            }
        });

        // Toggle clicked dropdown
        const content = document.getElementById(contentId);
        const arrow = element.querySelector('.arrow');

        if (content && arrow) {
            content.classList.toggle('w3-show');
            arrow.classList.toggle('up');
        }
    },

    // Sidebar dropdown handler
    'sidebarDropdown': (element) => {
        const contentId = element.dataset.target;

        // First, close ALL sidebar dropdowns (except the one we might toggle)
        document.querySelectorAll('#mySidebar [id^="dropSm"]').forEach(dropdown => {
            if (dropdown.id !== contentId) {
                dropdown.classList.remove('w3-show');
                // Also add w3-hide to ensure they're completely hidden
                dropdown.classList.add('w3-hide');
            }
        });

        // Reset ALL sidebar arrows (except the one we're toggling)
        document.querySelectorAll('#mySidebar .arrow').forEach(arrow => {
            const parent = arrow.closest('.drop-menu');
            if (parent && parent.dataset.target !== contentId) {
                arrow.classList.remove('up');
            }
        });

        // Toggle clicked dropdown
        const content = document.getElementById(contentId);
        if (content) {
            content.classList.toggle('w3-show');
            content.classList.toggle('w3-hide'); // Toggle both classes for W3.CSS

            const arrow = element.querySelector('.arrow');
            if (arrow) {
                arrow.classList.toggle('up');
            }
        }
    }
};

function handleNavigationClick(evt) {
    // Check what was clicked
    const sidebarToggle = evt.target.closest('#side-bar-navigation');
    if (sidebarToggle) {
        evt.preventDefault();
        navHandlers.sidebar();
        return;
    }

    const dropdownTrigger = evt.target.closest('.drop-menu');
    if (dropdownTrigger) {
        evt.preventDefault();
        // Determine if in sidebar or main navigation
        const isInSidebar = !!dropdownTrigger.closest('#mySidebar');
        isInSidebar ? navHandlers.sidebarDropdown(dropdownTrigger) : navHandlers.mainDropdown(dropdownTrigger);
        return;
    }

    // If we reach here, it's a normal link - let it proceed
}