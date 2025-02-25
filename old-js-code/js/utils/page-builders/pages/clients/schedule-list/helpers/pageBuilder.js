import { buildEle } from "../../../../../dom/domUtils.js";
import buildSearchBlock from "../../../../helpers/buildSearchBlock.js";
import buildScheduleTitleBlock from "./buildScheduleTitleBlock.js";
import buildClientListPersonalNotes from "./buildClientListPersonalNotes.js";
import buildClientList from "./buildClientList.js";

/**
 * Configuration for schedule list page elements
 * @typedef {Object} PageConfig
 * @property {Array<{value: string, text: string}>} filterOptions - Search filter dropdown options
 * @property {Object} container - Main container element configuration
 * @property {string} container.type - Element type ('div')
 * @property {string[]} container.class - CSS classes for container
 * @property {Object} wrapper - Schedule list wrapper configuration
 * @property {string} wrapper.type - Element type ('div')
 * @property {Object} wrapper.attributes - Element attributes
 * @property {string} wrapper.attributes.id - Element ID ('schedule-list')
 * @property {Object} formMsg - Form message container configuration
 * @property {string} formMsg.type - Element type ('div')
 * @property {string[]} formMsg.class - CSS classes for message container
 * @property {Object} counter - Client counter element configuration
 * @property {string} counter.type - Element type ('div')
 * @property {string[]} counter.class - CSS classes for counter
 */
const PAGE_CONFIG = {
    filterOptions: {
        list: [
        { value: 'client-name', text: 'Search By Client Name' },
        { value: 'phone', text: 'Search By Phone' },
        { value: 'address', text: 'Search By Address' },
        { value: 'app-time', text: 'Search By Time' },
        { value: 'app-date', text: 'Search By Date' },
        ],
        value: opt => opt.value,
        text: opt => opt.text,
    },
    container: {
        type: 'div',
        myClass: ['w3-container']
    },
    wrapper: {
        type: 'div',
        attributes: { id: 'schedule-list' },
    },
    counter: {
        type: 'div',
        myClass: ['w3-small']
    }
};

/**
 * Builds all page elements
 * @param {Object} params - Build parameters
 * @returns {Promise<Object>} Page elements object
 */
export async function buildPageElements({ active, cID, primaryKey }) {
    try {
        const container = buildEle(PAGE_CONFIG.container);
        const scheduleListWrapper = buildEle(PAGE_CONFIG.wrapper);
        const [
            personalNotesContainer,
            searchBlock,
            scheduleTitleBlock,
            [clientScheduleList, count]
        ] = await Promise.all([
            buildClientListPersonalNotes(),
            buildSearchBlock(PAGE_CONFIG.filterOptions),
            buildScheduleTitleBlock(),
            buildClientList({ active, clientID: cID, primaryKey })
        ]);

        const clientCounter = buildEle({
            ...PAGE_CONFIG.counter,
            text: `<span class="w3-small">Current Clients: ${count}</span>`,
        });

        scheduleListWrapper.appendChild(clientScheduleList);
        container.append(personalNotesContainer, searchBlock, scheduleTitleBlock, scheduleListWrapper, clientCounter);

        return container;
    }
    catch (err) {
        const { handleError } = await import("../../../../../error-messages/handleError.js");
        await handleError({
            filename: 'buildPageElementsError',
            consoleMsg: 'Build page elements error: ',
            err,
        });
        throw err; // Propagate error to caller
    }
}