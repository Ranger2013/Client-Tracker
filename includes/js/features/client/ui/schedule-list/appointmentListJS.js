import { dropDownClientMenu } from '../../../../core/navigation/services/dropDownClientMenu';
import { createDebouncedHandler, getOptimalDelay } from '../../../../core/utils/dom/eventUtils';
import { addListener, removeListeners } from '../../../../core/utils/dom/listeners';
import { safeDisplayMessage } from '../../../../core/utils/dom/messages';
import { handleSearch } from './components/searchHandlers';

const COMPONENT_ID = 'schedule-list';

/**
 * Initializes the client list functionality.
 * Sets up event listeners for filtering and searching the client list.
 * @returns {Promise<Function>} A cleanup function to remove all event listeners.
 */
export default async function appointmentList({active, cID, primaryKey, manageClient, manageUser, mainContainer}) {
    try {
        // Handle search and filter events
        try {
            await initializeSearchHandlers({manageUser});
        }
        catch (err) {
            const { AppError } = await import("../../../../core/errors/models/AppError.js");
            AppError.handleError(err, {
                errorCode: AppError.Types.INITIALIZATION_ERROR,
                userMessage: AppError.BaseMessages.system.initialization,
            });
        }

            initializeMenuHandlers();

        //     console.log('Initialized menu handlers');
            return () => removeListeners(COMPONENT_ID);
    }
    catch (err) {
        const { AppError } = await import("../../../../core/errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.INITIALIZATION_ERROR,
            userMessage: AppError.BaseMessages.system.initialization,
        });
    }
}

async function initializeSearchHandlers({manageUser}) {
    try {
        const filter = document.getElementById('filter');
        const search = document.getElementById('search');

        if (!filter || !search) {
            throw new Error('Search elements not found');
        }

        const debouncedSearch = createDebouncedHandler(
            (evt) => handleSearch({evt, manageUser}),
            getOptimalDelay('search')
        );

        // User Input event
        addListener({
            elementOrId: search,
            eventType: 'input',
            handler: (evt) => {
                // Show "Searching..." message when typing starts
                if (evt.target.value) {
                    safeDisplayMessage({
                        elementId: 'page-msg',
                        message: 'Searching...',
                        isSuccess: true,
                        color: 'w3-text-blue',
                    });
                }
                debouncedSearch(evt);
            },
            componentId: COMPONENT_ID,
        })

        // Filter change event
        addListener({
            elementOrId: filter,
            eventType: 'change',
            handler: (evt) => {
                if (search.value) {
                    safeDisplayMessage({
                        elementId: 'page-msg',
                        message: 'Searching...',
                        isSuccess: true,
                        color: 'w3-text-blue',
                    });
                }
                debouncedSearch({
                    target: {
                        value: search.value
                    }
                });
            },
            componentId: COMPONENT_ID,
        });
    }
    catch (err) {
        const { AppError } = await import("../../../../core/errors/models/AppError.js");
        AppError.process(err, {
            errorCode: AppError.Types.INITIALIZATION_ERROR,
            userMessage: 'Search functionality not available at the moment.',
            displayTarget: 'page-msg',
        }, true);
    }
}

function initializeMenuHandlers() {
    const scheduleList = document.getElementById('appointment-list');
    if (!scheduleList) return;

    addListener({
        elementOrId: scheduleList,
        eventType: 'click',
        handler: async (evt) => {
            try{
                const button = evt.target.closest('[data-action="manage-client"]');
                if (button) {
                    await dropDownClientMenu(evt);
                    return;
                }
    
                // Close menus when clicking outside
                if (!evt.target.closest('.w3-dropdown-content')) {
                    const openMenus = document.querySelectorAll('.w3-dropdown-content.w3-show');
                    openMenus.forEach(menu => menu.classList.remove('w3-show'));
                }
            }
            catch(err) {
                const { AppError } = await import("../../../../core/errors/models/AppError.js");
                AppError.handleError(err, {
                    errorCode: AppError.Types.INITIALIZATION_ERROR,
                    userMessage: 'Manage client menu not available at the moment.',
                });
            }
        },
        componentId: COMPONENT_ID,
    });
}