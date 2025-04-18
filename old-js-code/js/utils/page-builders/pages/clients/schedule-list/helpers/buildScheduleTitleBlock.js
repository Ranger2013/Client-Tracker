import { buildEle } from "../../../../../dom/domUtils.js";

/**
 * Configuration for schedule title columns
 * @typedef {Object} TitleConfig
 * @property {string[]} myClass - Array of CSS classes
 * @property {string} text - Column header text
 */
const PAGE_CONFIG = {
    titleRow: {
        type: 'div',
        myClass: ['w3-row', 'w3-padding-small', 'w3-dark-grey']
    },
    columns: [
        { myClass: ['w3-col', 'm2', 's4', 'w3-center', 'w3-bold'], text: 'Client Name' },
        { myClass: ['w3-col', 'm2', 'w3-center', 'w3-bold', 'w3-hide-small'], text: 'Address' },
        { myClass: ['w3-col', 'm2', 'w3-center', 'w3-bold', 'w3-hide-small'], text: 'Phone' },
        { myClass: ['w3-col', 'm2', 'w3-center', 'w3-bold', 'w3-hide-small'], text: 'Appointment' },
        { myClass: ['w3-col', 'm2', 's4', 'w3-center', 'w3-bold'], text: 'Next Trim' },
        { myClass: ['w3-col', 'm2', 's4', 'w3-center', 'w3-bold'], text: 'Edit Client' }
    ]
};

/**
 * Builds schedule title block with column headers
 * @returns {Promise<HTMLElement>} Title block row element
 * @throws {Error} If building fails
 */
export default async function buildScheduleTitleBlock() {
    try {
        const titleBlockRow = buildEle(PAGE_CONFIG.titleRow);
        
        PAGE_CONFIG.columns.forEach(column => 
            titleBlockRow.appendChild(
                buildEle({
                    type: 'div',
                    myClass: column.myClass,
                    text: column.text
                })
            )
        );

        return titleBlockRow;
    }
    catch (err) {
        const { handleError } = await import("../../../../../error-messages/handleError.js");
        await handleError({
            filename: 'buildScheduleTitleBlockError',
            consoleMsg: 'Build schedule title block error: ',
            err,
            userMsg: 'Unable to create schedule title block',
            errorEle: 'page-msg',
        });
        throw err;
    }
}