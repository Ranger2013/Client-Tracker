import { buildEle, clearMsg, top } from "../../../../../dom/domUtils.js";
import { renderPage } from "../../../../../dom/renderUtils.js";
import { RENDER_CONFIGS } from "../../../../config/renderConfigs.js";
import buildSearchBlock from "../../../../helpers/buildSearchBlock.js";
import buildScheduleTitleBlock from "./buildScheduleTitleBlock.js";
import buildClientListPersonalNotes from "./buildClientListPersonalNotes.js";
import buildClientList from "./buildClientList.js";
import { PAGE_CONFIG } from "./config.js";

export async function initializePage(mainContainer) {
    clearMsg({ container: 'page-msg' });
    top();
    if (!mainContainer) throw new Error('mainContainer is required');
}

export async function buildPageElements({ active, cID, primaryKey }) {
    try {
        const container = buildEle(PAGE_CONFIG.container);
        const scheduleListWrapper = buildEle({
            type: 'div',
            attributes: { id: 'schedule-list' }
        });

        const [
            personalNotesContainer,
            searchBlock, 
            scheduleTitleBlock,
            [clientScheduleList, clientCount]
        ] = await Promise.all([
            buildClientListPersonalNotes(container),
            buildSearchBlock(PAGE_CONFIG.filterOptions),
            buildScheduleTitleBlock(),
            buildClientList({ active, clientID: cID, primaryKey })
        ]);

        scheduleListWrapper.appendChild(clientScheduleList);

        return {
            container,
            formMsg: buildEle(PAGE_CONFIG.formMsg),
            personalNotes: personalNotesContainer,
            searchBlock,
            scheduleTitle: scheduleTitleBlock,
            scheduleList: scheduleListWrapper,
            counter: buildClientCounter(clientCount)
        };
    } catch (err) {
        const { handleError } = await import("../../../../../error-messages/handleError.js");
        await handleError(
            'buildPageElementsError',
            'Failed to build page elements:',
            err,
            'Unable to build page components.',
            'page-msg'
        );
        throw err;
    }
}

// Remove the duplicate renderPage function and use this wrapper instead
export function renderSchedulePage(mainContainer, elements) {
    renderPage(mainContainer, elements, {
        renderOrder: RENDER_CONFIGS.scheduleList.renderOrder,
        targetContainer: elements.container
    });
}

function buildClientCounter(count) {
    return buildEle({
        ...PAGE_CONFIG.counter,
        text: `Current Clients: ${count}`
    });
}

export const RENDER_ORDER = [
    'personalNotes',
    'formMsg',
    'searchBlock',
    'scheduleList',
    'counter'
];
