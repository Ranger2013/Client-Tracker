import { addListener, removeListeners } from "../../../utils/event-listeners/listeners.js";
import { createDebouncedHandler, getOptimalDelay } from "../../../utils/event-listeners/eventUtils.js";
import { handleSearch } from "./helpers/searchHandlers.js";
import { mySuccess } from "../../../utils/dom/domUtils.js";
import { dropDownClientMenu } from '../../../utils/navigation/dropDownClientMenu.js'; // Updated import path

const COMPONENT_ID = 'schedule-list';

/**
 * Initializes the client list functionality.
 * Sets up event listeners for filtering and searching the client list.
 * @returns {Promise<Function>} A cleanup function to remove all event listeners.
 */
export default async function clientList() {
    try {
        console.log('In clientList');
        
        initializeSearchHandlers();

        console.log('Initialized search handlers');

        initializeMenuHandlers();

        console.log('Initialized menu handlers');
        return () => removeListeners(COMPONENT_ID);
    } catch (err) {
        const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
        await errorLogs('buildClientTrimDateError', 'Build client trim date error: ', err);
        return () => { };
    }
}

function initializeSearchHandlers() {
    const filter = document.getElementById('filter');
    const search = document.getElementById('search');

    if (!filter || !search) {
        throw new Error('Search elements not found');
    }

    const debouncedSearch = createDebouncedHandler(
        handleSearch,
        getOptimalDelay('search')
    );

    addListener(search, 'input', (evt) => {
        // Show "Searching..." message when typing starts
        if (evt.target.value) {
            mySuccess('page-msg', 'Searching...', 'w3-text-blue');
        }
        debouncedSearch(evt);
    }, COMPONENT_ID);

    addListener(filter, 'change', () => {
        if (search.value) {
            mySuccess('page-msg', 'Searching...', 'w3-text-blue');
        }
        debouncedSearch({
            target: {
                value: search.value
            }
        });
    }, COMPONENT_ID);
}

function initializeMenuHandlers() {
    const scheduleList = document.getElementById('schedule-list');
    if (!scheduleList) return;

    addListener(scheduleList, 'click', async (evt) => {
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
    }, COMPONENT_ID);
}