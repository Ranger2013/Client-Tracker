import { buildEle } from "../../../../../dom/domUtils.js";

/**
 * Builds the schedule title block for the client list.
 * @returns {Promise<HTMLElement>} The constructed title block row element.
 */
export default async function buildScheduleTitleBlock() {
    try {
        // Build title block row
        const titleBlockRow = buildEle({
            type: 'div',
            myClass: ['w3-row', 'w3-padding-small', 'w3-dark-grey']
        });

        // Define the columns with their respective classes and text
        const columns = [
            { myClass: ['w3-col', 'm2', 's4', 'w3-center', 'w3-bold'], text: 'Client Name' },
            { myClass: ['w3-col', 'm2', 'w3-center', 'w3-bold', 'w3-hide-small'], text: 'Address' },
            { myClass: ['w3-col', 'm2', 'w3-center', 'w3-bold', 'w3-hide-small'], text: 'Phone' },
            { myClass: ['w3-col', 'm2', 'w3-center', 'w3-bold', 'w3-hide-small'], text: 'Appointment' },
            { myClass: ['w3-col', 'm2', 's4', 'w3-center', 'w3-bold'], text: 'Next Trim' },
            { myClass: ['w3-col', 'm2', 's4', 'w3-center', 'w3-bold'], text: 'Edit Client' }
        ];

        // Build and append each column to the title block row
        columns.forEach(col => {
            const columnElement = buildEle({
                type: 'div',
                myClass: col.myClass,
                text: col.text
            });
            titleBlockRow.appendChild(columnElement);
        });

        return titleBlockRow;
    }
	 catch (err) {
        // Log the error using the errorLogs utility
        const { default: errorLogs } = await import("../../../../../../utils/error-messages/errorLogs.js");
        await errorLogs('buildScheduleTitleBlockError', 'Build schedule title block error: ', err);
        throw err;
    }
}