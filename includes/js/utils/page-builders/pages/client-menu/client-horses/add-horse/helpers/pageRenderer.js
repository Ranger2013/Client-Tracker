import { buildEle } from "../../../../../../../dom/domUtils.js";
import buildPageContainer from "../../../../../../helpers/buildPageContainer.js";
import { buildAddHorseForm } from "./formBuilder.js";

export async function buildPageElements(clientInfo) {
    const [[container, card], form] = await Promise.all([
        buildPageContainer({
            pageTitle: 'Add New Horse for ',
            clientName: clientInfo.client_name,
            cID: clientInfo.cID,
            primaryKey: clientInfo.primaryKey
        }),
        buildAddHorseForm()
    ]);

    const formMsg = buildEle({
        type: 'div',
        attributes: { id: 'form-msg' },
        myClass: ['w3-center']
    });

    return { container, card, form, formMsg };
}

export function renderPage(mainContainer, { container, card, form, formMsg }) {
    mainContainer.innerHTML = '';
    card.appendChild(formMsg);
    card.appendChild(form);
    container.appendChild(card);
    mainContainer.appendChild(container);
}
