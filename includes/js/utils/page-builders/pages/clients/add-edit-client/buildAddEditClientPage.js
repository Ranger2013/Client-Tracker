import { buildEle, clearMsg } from "../../../../dom/domUtils.js";
import { removeAllListeners } from "../../../../event-listeners/listeners.js";
import { trimCycleConfigurations } from "../../../../configurations/trimCycleConfigurations.js";
import buildPageContainer from "../../../helpers/buildPageContainer.js";
import buildSubmitButtonSection from "../../../helpers/buildSubmitButtonSection.js";
import buildSubmitDeleteButtonSection from "../../../helpers/buildSubmitDeleteButtonSection.js";
import buildTwoColumnAddressSection from "../../../helpers/buildTwoColumnAddressSection.js";
import buildTwoColumnInputSection from "../../../helpers/buildTwoColumnInputSection.js";
import buildTwoColumnRadioButtonSection from "../../../helpers/buildTwoColumnRadioButtonSection.js";
import buildTwoColumnSelectElementSection from "../../../helpers/buildTwoColumnSelectElementSection.js";
import getClientInformation from "./helpers/getClientInformation.js";

/**
 * Asynchronously builds the Add/Edit Client page.
 *
 * @param {Object} params - The parameters for building the page.
 * @param {string|null} params.cID - The client ID.
 * @param {string|null} params.primaryKey - The primary key.
 * @param {HTMLElement} params.mainContainer - The main container element.
 * @returns {Promise<void>} - A Promise that resolves when the page has been built.
 * @throws {Error} - Throws an error if the page could not be built.
 */
export default async function buildAddEditClientPage({ cID = null, primaryKey = null, mainContainer }) {
    try {
        // Clear any page msgs
        clearMsg({ container: 'page-msg' });

        // Initialize variables to hold client info if we are editing
        let clientInfo = null;
        let clientAnchor = null;
        let clientName = null;
        let submitButton = null;

        // Initialize field values for the form
        let fieldValues = {
            client_name: '',
            street: '',
            city: '',
            state: '',
            zip: '',
            distance: '',
            phone: '',
            email: '',
            trim_cycle: '',
            trim_date: '',
            app_time: '',
            active: '',
        };

        // Check if we are editing or adding a client
        if ((cID && cID !== '') || (primaryKey && primaryKey !== '')) {
            try {
                // Get the client's information
                clientInfo = await getClientInformation({ cID, primaryKey, fieldValues });
                clientAnchor = `/tracker/clients/appointments/?cID=${cID}&key=${primaryKey}`;
                clientName = clientInfo.client_name;

                // Set the field values
                Object.keys(fieldValues).forEach(key => {
                    if (clientInfo[key] !== undefined) {
                        fieldValues[key] = clientInfo[key];
                    }
                });
                // Set the update and delete button
                submitButton = await buildSubmitDeleteButtonSection({ submitButtonText: 'Edit Client', deleteButtonText: 'Delete Client' });
            } catch (err) {
                // Handle error (e.g., show a backup page)
            }
        } else {
            // Set the submit button for adding a new client
            submitButton = await buildSubmitButtonSection('Add Client');
        }

        // Set the page title based on whether we are adding or editing a client
        const pageTitle = !clientInfo ? 'Add a new Client' : 'Edit ';

        // Build the page container
        const [container, card] = await buildPageContainer({ pageTitle, clientAnchor, clientName, cID, primaryKey });

        // Build the form element
        const form = buildEle({
            type: 'form',
            attributes: { id: 'client-form' },
        });
        card.appendChild(form);

        // Build the sections of the form concurrently
        const sections = await Promise.all([
            // Client name section
            buildTwoColumnInputSection({
                labelText: 'Client Name:',
                inputID: 'client-name',
                inputType: 'text',
                inputName: 'client_name',
                inputTitle: 'Client Name',
                inputValue: fieldValues.client_name,
            }),
            // Address section
            buildTwoColumnAddressSection('Address:', 'street', [
                { typeEle: 'input', inputId: 'street', inputType: 'text', inputName: 'street', inputTitle: 'Street', inputClass: 'w3-input w3-border w3-padding-small input', inputRequired: 'required', inputValue: fieldValues.street },
                { typeEle: 'input', inputId: 'city', inputType: 'text', inputName: 'city', inputTitle: 'City', inputClass: 'w3-input w3-border w3-padding-small input', inputRequired: 'required', inputValue: fieldValues.city },
                { typeEle: 'input', inputId: 'state', inputType: 'text', inputName: 'state', inputTitle: 'State', inputClass: 'w3-input w3-border w3-padding-small input', inputRequired: 'required', inputValue: fieldValues.state },
                { typeEle: 'input', inputId: 'zip', inputType: 'text', inputName: 'zip', inputTitle: 'Zip Code (Optional)', inputClass: 'w3-input w3-border w3-padding-small input', inputPattern: '[0-9]{5}', inputValue: fieldValues.zip, note: 'Zip code is required for accepting credit card payments from your client.' },
            ]),
            // Distance Section
            buildTwoColumnInputSection({
                labelText: 'Distance:',
                inputID: 'distance',
                inputType: 'number',
                inputName: 'distance',
                inputTitle: 'Total Distance to Client',
                inputValue: fieldValues.distance,
            }),
            // Client phone section
            buildTwoColumnInputSection({
                labelText: 'Client Phone#:',
                inputID: 'phone',
                inputType: 'tel',
                inputName: 'phone',
                inputTitle: 'Client Phone: xxx-xxx-xxxx',
                inputValue: fieldValues.phone,
            }),
            // Client email section
            buildTwoColumnInputSection({
                labelText: 'Client Email:',
                inputID: 'email',
                inputType: 'email',
                inputName: 'email',
                inputTitle: 'Client Email',
                inputValue: fieldValues.email,
            }),
            // Trimming/Shoeing Cycle section
            buildTwoColumnSelectElementSection({
                labelText: 'Trimming/Shoeing Cycle:',
                selectID: 'trim-cycle',
                selectName: 'trim_cycle',
                selectTitle: 'Trimming/Shoeing Cycle',
                options: trimCycleConfigurations(fieldValues),
            }),
            // Appointment date section
            buildTwoColumnInputSection({
                labelText: 'Trimming/Shoeing Date:',
                inputID: 'trim-date',
                inputName: 'trim_date',
                inputType: 'date',
                inputTitle: 'Trimming/Shoeing Date',
                inputValue: fieldValues.trim_date,
            }),
            // Appointment time section
            buildTwoColumnInputSection({
                labelText: 'Appointment Time:',
                inputID: 'app-time',
                inputName: 'app_time',
                inputType: 'time',
                inputTitle: 'Appointment Time',
                inputValue: fieldValues.app_time,
            }),
            // Active status section
            buildTwoColumnRadioButtonSection({
                labelText: 'Active Status:',
                buttons: [
                    { type: 'radio', name: 'active', value: 'yes', labelText: 'Yes', checked: fieldValues.active === 'yes' || fieldValues.active === '' ? 'checked' : undefined },
                    { type: 'radio', name: 'active', value: 'no', labelText: 'No', checked: fieldValues.active === 'no' ? 'checked' : undefined },
                ],
            }),
        ]);

        // Append all sections to the form
        sections.forEach(section => form.appendChild(section));
        form.appendChild(submitButton);
        card.appendChild(form);
        container.appendChild(card);

        mainContainer.innerHTML = '';
        mainContainer.appendChild(container);

        // Import and initialize the add/edit client script
        const { default: addEditClient } = await import("../../../../../pages/clients/add-edit-client/addEditClientJS.js");
        await addEditClient(cID, primaryKey, clientInfo);

        return removeAllListeners;
    } catch (err) {
        console.log('buildAddEditClientPageError: ', err);
        
        const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
        await handleError(
            'buildAddEditClientPageError',
            'Build add/edit client page error: ',
            err,
            'Unable to display the add/edit client page. Please try again later.',
            'page-msg',
        );
    }
}