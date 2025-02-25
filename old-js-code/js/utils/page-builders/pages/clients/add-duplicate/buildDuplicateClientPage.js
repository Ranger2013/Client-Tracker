import ManageClient from "../../../../../classes/ManageClient.js";
import { buildEle, clearMsg } from "../../../../dom/domUtils.js";
import { removeAllListeners } from "../../../../event-listeners/listeners.js";
import { cleanUserOutput } from "../../../../string/stringUtils.js";
import buildPageContainer from "../../../helpers/buildPageContainer.js";
import buildSubmitButtonSection from "../../../helpers/buildSubmitButtonSection.js";
import buildTwoColumnInputSection from "../../../helpers/buildTwoColumnInputSection.js";
import buildTwoColumnSelectElementSection from "../../../helpers/buildTwoColumnSelectElementSection.js";

export default async function buildDuplicateClientPage({ mainContainer }) {
    try {
        clearMsg({ container: 'page-msg' });

        // Build all sections concurrently
        const [
            [container, card],
            filterSection, 
            selectClientSection, 
            buttonSection,
        ] = await Promise.all([
            buildPageContainer({
                pageTitle: 'Duplicate a Current Client'
            }),
            // Filter Section
            buildTwoColumnInputSection({
                labelText: 'Filter Client List:',
                inputID: 'filter-client',
                inputType: 'text',
                inputTitle: 'Filter Client List',
            }),
            // Select Client Section
            buildTwoColumnSelectElementSection({
                labelText: 'Select a Client:',
                selectID: 'duplicate-client',
                selectName: 'duplicate_client',
                selectTitle: 'Select a Client to Duplicate',
                required: true,
                options: await getClientList()
            }),
            // Submit Button Section
            buildSubmitButtonSection('Duplicate Client'),
        ]);

        // Build form and container elements
        const [form, clientContainer] = [
            { type: 'form', attributes: { id: 'duplicate-form' } },
            { type: 'div', attributes: { id: 'client-container' } }
        ].map(config => buildEle(config));

        // Assemble page
        form.append(filterSection, selectClientSection, clientContainer, buttonSection);
        card.appendChild(form);
        container.appendChild(card);
        
        // Render and initialize
        mainContainer.innerHTML = '';
        mainContainer.appendChild(container);

        const { default: duplicateClient } = await import('../../../../../pages/clients/duplicate-client/duplicateClientJS.js');
        await duplicateClient({ clientContainer });

        return removeAllListeners;

    } catch (err) {
        const { handleError } = await import("../../../../error-messages/handleError.js");
        await handleError(
            'buildDuplicateClientPageError',
            'Error building duplicate client page:',
            err,
            'Unable to build the duplicate client page. Please try again later.',
            'page-msg'
        );
    }
}

async function getClientList() {
    try {
        const manageClient = new ManageClient();
        const clientList = await manageClient.getClientScheduleList();

        const defaultOption = {
            value: 'null',
            text: '-- Select a Client --',
            selected: true,
            disabled: true
        };

        if (!clientList?.length) return [defaultOption];

        return [
            defaultOption,
            ...clientList.map(client => ({
                value: client.cID,
                text: cleanUserOutput(client.client_name)
            }))
        ];
    } catch (err) {
        const { handleError } = await import("../../../../error-messages/handleError.js");
        await handleError(
            'getClientListError',
            'Error getting client list:',
            err,
            'Unable to show the duplicate client page.',
            'page-msg'
        );
    }
}
