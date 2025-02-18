import { buildEle } from "../../dom/domUtils.js";
import { addListener } from "../../event-listeners/listeners.js";
import selectPage from "../../navigation/selectPage.js";

export default async function buildPageContainer({ pageTitle, clientName = null, cID = null, primaryKey = null }) {
    try {
        // Create elements synchronously since buildEle is not async
        const container = buildEle({
            type: 'div',
            myClass: ['w3-container']
        });

        const card = buildEle({
            type: 'div',
            myClass: ['w3-card']
        });

        const titleDiv = buildEle({
            type: 'div',
            myClass: ['w3-center']
        });

        // Only create form-msg if it doesn't exist
        const formMsg = !document.getElementById('form-msg') ? 
            buildEle({
                type: 'div',
                attributes: { id: 'form-msg' }
            }) : null;

        // Build title with optional client anchor
        const title = buildEle({
            type: 'h5',
            text: pageTitle
        });

        if (clientName && cID && primaryKey) {
            const anchor = buildEle({
                type: 'a',
                attributes: {
                    id: 'add-edit-title',
                    href: `/tracker/clients/appointments/?cID=${cID}&key=${primaryKey}`
                },
                myClass: ['w3-text-underline'],
                text: clientName
            });

            title.appendChild(anchor);
            addListener(anchor, 'click', evt => 
                selectPage({
                    evt,
                    page: 'singleClient',
                    cID,
                    primaryKey
                })
            );
        }

        // Assemble components
        titleDiv.appendChild(title);
        if (formMsg) titleDiv.appendChild(formMsg);
        card.appendChild(titleDiv);

        // Don't append container to card - return both separately
        return [container, card];

    } catch (err) {
        const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
        await errorLogs('buildPageContainerError', 'Build Page Container Error:', err);
        throw err; // Let selectPage handle the error
    }
}