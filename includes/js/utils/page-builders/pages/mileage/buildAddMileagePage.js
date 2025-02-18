import { buildEle, clearMsg } from "../../../dom/domUtils.js";
import { removeAllListeners } from "../../../event-listeners/listeners.js";
import buildPageContainer from "../../helpers/buildPageContainer.js";
import buildSubmitButtonSection from "../../helpers/buildSubmitButtonSection.js";
import buildTwoColumnInputSection from "../../helpers/buildTwoColumnInputSection.js";

/**
 * Builds the add mileage page
 * @param {Object} params - The parameters for building the page
 * @param {HTMLElement} params.mainContainer - The main container to render the page into
 * @returns {Promise<Function>} Cleanup function to remove event listeners
 */
export default async function buildAddMileagePage({ mainContainer }) {
    try {
        clearMsg({ container: 'page-msg' });

        // Build all sections concurrently for better performance
        const [[container, card], sectionOne, sectionTwo, sectionThree, buttonSection] = await Promise.all([
            buildPageContainer({
                pageTitle: 'Add Mileage'
            }),
            buildDestinationSection(),
            buildTwoColumnInputSection({
                labelText: 'Starting Mileage:',
                inputID: 'starting-mileage',
                inputType: 'number',
                inputName: 'starting_miles',
                inputTitle: 'Starting Mileage'
            }),
            buildTwoColumnInputSection({
                labelText: 'Ending Mileage:',
                inputID: 'ending-mileage',
                inputType: 'number',
                inputName: 'ending_miles',
                inputTitle: 'Ending Mileage',
                required: true
            }),
            buildSubmitButtonSection('Add Mileage')
        ]);

        const mileageForm = buildEle({
            type: 'form',
            attributes: { id: 'mileage-form' }
        });

        // Assemble page
        mileageForm.append(sectionOne, sectionTwo, sectionThree, buttonSection);
        card.appendChild(mileageForm);
        container.appendChild(card);

        // Render and initialize
        mainContainer.innerHTML = '';
        mainContainer.appendChild(container);

        const { default: addMileage } = await import("../../../../pages/mileage/add/addMileageJS.js");
        await addMileage();

        return removeAllListeners;

    } catch (err) {
        const { handleError } = await import("../../../error-messages/handleError.js");
        await handleError(
            'buildAddMileagePageError',
            'Build add mileage page error: ',
            err,
            'Unable to build the add mileage page. Please try again later.',
            'page-msg'
        );
    }
}

/**
 * Builds the destination section with client selection buttons
 * @returns {Promise<HTMLElement>} The destination section element
 */
async function buildDestinationSection() {
    try {
        const row = buildEle({
            type: 'div',
            myClass: ['w3-row', 'w3-padding']
        });

        const [labelCol, buttonCol] = [
            { type: 'div', myClass: ['w3-col', 'm6', 'w3-padding-small'], text: 'Destination:' },
            { type: 'div', myClass: ['w3-col', 'm6', 'w3-padding-small', 'w3-center'] }
        ].map(config => buildEle(config));

        // Build button container
        const buttonRow = buildEle({
            type: 'div',
            myClass: ['w3-row', 'w3-padding-small']
        });

        // Build buttons
        const buttons = {
            client: { id: 'client-list-button', text: 'Select Client' },
            destination: { id: 'destination-button', text: 'Input Destination' }
        };

        Object.values(buttons).forEach(btn => {
            const col = buildEle({
                type: 'div',
                myClass: ['w3-col', 's6', 'w3-center']
            });
            
            const button = buildEle({
                type: 'button',
                attributes: { id: btn.id },
                myClass: ['w3-button', 'w3-black', 'w3-hover-light-grey', 'w3-padding-small', 'w3-round', 'w3-card'],
                text: btn.text
            });

            col.appendChild(button);
            buttonRow.appendChild(col);
        });

        buttonCol.appendChild(buttonRow);
        buttonCol.appendChild(buildEle({
            type: 'div',
            attributes: { id: 'destination-container' },
            myClass: ['w3-padding-small']
        }));

        row.append(labelCol, buttonCol);
        return row;

    } catch (err) {
        const { handleError } = await import("../../../error-messages/handleError.js");
        await handleError('buildDestinationSectionError', 'Build destination section error:', err);
        throw err;
    }
}

