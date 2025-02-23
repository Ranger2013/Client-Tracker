import { buildEle } from "../../../../../dom/domUtils.js";
import buildSearchBlock from "../../../../helpers/buildSearchBlock.js";
import buildScheduleTitleBlock from "./buildScheduleTitleBlock.js";
import buildClientListPersonalNotes from "./buildClientListPersonalNotes.js";
import buildClientList from "./buildClientList.js";

const PAGE_CONFIG = {
    filterOptions: [
        { value: 'client-name', text: 'Search By Client Name' },
        { value: 'phone', text: 'Search By Phone' },
        { value: 'address', text: 'Search By Address' },
        { value: 'app-time', text: 'Search By Time' },
        { value: 'app-date', text: 'Search By Date' },
    ],
    container: {
        type: 'div',
        class: ['w3-container']
    },
    wrapper: {
        type: 'div',
        attributes: { id: 'schedule-list' },
    },
    formMsg: {
        type: 'div',
        class: ['w3-center']
    },
    counter: {
        type: 'div',
        class: ['w3-small']
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
        const formMsg = buildEle(PAGE_CONFIG.formMsg);
        const [
            personalNotesContainer,
            searchBlock,
            scheduleTitleBlock,
            [clientScheduleList, count]
        ] = await Promise.all([
            buildClientListPersonalNotes(container),
            buildSearchBlock(PAGE_CONFIG.filterOptions),
            buildScheduleTitleBlock(),
            buildClientList({ active, clientID: cID, primaryKey })
        ]);

        const clientCounter = buildEle({
            ...PAGE_CONFIG.counter,
            text: `<span class="w3-small">Current Clients: ${count}</span>`,
        });

        scheduleListWrapper.appendChild(clientScheduleList);
        container.append(formMsg, personalNotesContainer, searchBlock, scheduleTitleBlock, scheduleListWrapper, clientCounter);
        return container;
    }
    catch (err) {
        const { handleError } = await import("../../../../../error-messages/handleError.js");
        await handleError({
            filename: 'buildPageElementsError',
            consoleMsg: 'Build page elements error: ',
            err,
            userMsg: 'Unable to build page components',
            errorEle: 'page-msg'
        });
        throw err; // Propagate error to caller
    }
}