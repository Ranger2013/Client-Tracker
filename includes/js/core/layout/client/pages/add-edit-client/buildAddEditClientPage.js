import { buildEle } from '../../../../utils/dom/elements.js';
import { trimCycleConfigurations } from '../../../../utils/dom/forms/trimCycleConfigurations.js';
import { removeListeners } from '../../../../utils/dom/listeners.js';
import { clearMsg } from '../../../../utils/dom/messages.js';
import buildPageContainer from '../../../components/buildPageContainer.js';
import buildSubmitButtonSection from '../../../components/buildSubmitButtonSection.js';
import buildTwoColumnAddressSection from '../../../components/buildTwoColumnAddressSection.js';
import buildTwoColumnInputSection from '../../../components/buildTwoColumnInputSection.js';
import buildTwoColumnRadioButtonSection from '../../../components/buildTwoColumnRadioButtonSection.js';
import buildTwoColumnSelectElementSection from '../../../components/buildTwoColumnSelectElementSection.js';

export const COMPONENT_ID = 'add-edit-client';

/**
 * @typedef {Object} ClientFields
 * @property {string} client_name - Client's full name
 * @property {string} street - Street address
 * @property {string} city - City name
 * @property {string} state - State code
 * @property {string} zip - ZIP/Postal code
 * @property {string} distance - Distance to client
 * @property {string} phone - Contact phone number
 * @property {string} email - Contact email
 * @property {string} trim_cycle - Trimming/Shoeing cycle
 * @property {string} trim_date - Next trim date
 * @property {string} app_time - Appointment time
 * @property {string} active - Active status
 */
const fieldValues = {
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
    active: ''
};

/**
 * Builds the Add/Edit Client page with form and handlers
 * @param {Object} params - Parameters for building the page
 * @param {string|null} params.cID - Client ID for editing mode
 * @param {string|null} params.primaryKey - Primary key for editing mode
 * @param {HTMLElement} params.mainContainer - Main container element
 * @returns {Function} Cleanup function for removing event listeners
 */
export default async function buildAddEditClientPage({ cID = null, primaryKey = null, mainContainer, manageClient, manageUser }) {
    try {
        clearMsg({ container: 'page-msg' });

        let clientInfo = null;
        let clientAnchor = null;
        let clientName = null;
        let submitButton = null;

        // Check if we are editing or adding a client
        if ((cID && cID !== '') || (primaryKey && primaryKey !== '')) {
            const { default: getClientInformation } = await import("./helpers/getClientInformation.js");

            // Get the client's information
            clientInfo = await getClientInformation({ cID, primaryKey, fieldValues });
            clientAnchor = `/tracker/clients/appointments/?cID=${cID}&key=${primaryKey}`;
            clientName = clientInfo.client_name;

            // Update field values with client info
            Object.keys(fieldValues).forEach(key => {
                if (clientInfo[key] !== undefined) {
                    fieldValues[key] = clientInfo[key];
                }
            });

            submitButton = await buildSubmitDeleteButtonSection({
                submitButtonText: 'Edit Client',
                deleteButtonText: 'Delete Client'
            });
        }
        else {
            submitButton = await buildSubmitButtonSection('Add Client');
        }

        const pageTitle = !clientInfo ? 'Add a new Client' : 'Edit ';
        const [container, card] = await buildPageContainer({
            pageTitle,
            clientAnchor,
            clientName,
            cID,
            primaryKey
        });

        // Build form
        const form = buildEle({
            type: 'form',
            attributes: { id: 'client-form' }
        });

        // Build all form sections concurrently
        const sections = await Promise.all([
            buildTwoColumnInputSection({
                labelText: 'Client Name:',
                inputID: 'client-name',
                inputType: 'text',
                inputName: 'client_name',
                inputTitle: 'Client Name',
                inputValue: fieldValues.client_name,
                required: 'required'
            }),
            buildTwoColumnAddressSection('Address:', 'street', [
                {
                    typeEle: 'input',
                    inputId: 'street',
                    inputType: 'text',
                    inputName: 'street',
                    inputTitle: 'Street',
                    inputClass: 'w3-input w3-border w3-padding-small input',
                    inputValue: fieldValues.street,
                    required: 'required'
                },
                {
                    typeEle: 'input',
                    inputId: 'city',
                    inputType: 'text',
                    inputName: 'city',
                    inputTitle: 'City',
                    inputClass: 'w3-input w3-border w3-padding-small input',
                    inputValue: fieldValues.city,
                    required: 'required'
                },
                {
                    typeEle: 'input',
                    inputId: 'state',
                    inputType: 'text',
                    inputName: 'state',
                    inputTitle: 'State',
                    inputClass: 'w3-input w3-border w3-padding-small input',
                    inputValue: fieldValues.state,
                    required: 'required'
                },
                {
                    typeEle: 'input',
                    inputId: 'zip',
                    inputType: 'text',
                    inputName: 'zip',
                    inputTitle: 'Zip Code (Optional)',
                    inputClass: 'w3-input w3-border w3-padding-small input',
                    inputPattern: '[0-9]{5}',
                    inputValue: fieldValues.zip,
                    note: 'Zip code is required for accepting credit card payments from your client.'
                }
            ]),
            buildTwoColumnInputSection({
                labelText: 'Distance:',
                inputID: 'distance',
                inputType: 'number',
                inputName: 'distance',
                inputTitle: 'Total Distance to Client',
                inputValue: fieldValues.distance,
            }),
            buildTwoColumnInputSection({
                labelText: 'Client Phone#:',
                inputID: 'phone',
                inputType: 'tel',
                inputName: 'phone',
                inputTitle: 'Client Phone: xxx-xxx-xxxx',
                inputValue: fieldValues.phone,
                required: 'required'
            }),
            buildTwoColumnInputSection({
                labelText: 'Client Email:',
                inputID: 'email',
                inputType: 'email',
                inputName: 'email',
                inputTitle: 'Client Email',
                inputValue: fieldValues.email
            }),
            buildTwoColumnSelectElementSection({
                labelText: 'Trimming/Shoeing Cycle:',
                selectID: 'trim-cycle',
                selectName: 'trim_cycle',
                selectTitle: 'Trimming/Shoeing Cycle',
                options: trimCycleConfigurations(fieldValues),
                required: 'required'
            }),
            buildTwoColumnInputSection({
                labelText: 'Trimming/Shoeing Date:',
                inputID: 'trim-date',
                inputName: 'trim_date',
                inputType: 'date',
                inputTitle: 'Trimming/Shoeing Date',
                inputValue: fieldValues.trim_date,
                required: 'required'
            }),
            buildTwoColumnInputSection({
                labelText: 'Appointment Time:',
                inputID: 'app-time',
                inputName: 'app_time',
                inputType: 'time',
                inputTitle: 'Appointment Time',
                inputValue: fieldValues.app_time,
                required: 'required'
            }),
            buildTwoColumnRadioButtonSection({
                labelText: 'Active Status:',
                buttons: [
                    {
                        type: 'radio',
                        name: 'active',
                        value: 'yes',
                        labelText: 'Yes',
                        checked: fieldValues.active === 'yes' || fieldValues.active === '' ? 'checked' : undefined
                    },
                    {
                        type: 'radio',
                        name: 'active',
                        value: 'no',
                        labelText: 'No',
                        checked: fieldValues.active === 'no' ? 'checked' : undefined
                    }
                ]
            })
        ]);

        sections.forEach(section => form.appendChild(section));
        form.appendChild(submitButton);
        card.appendChild(form);
        container.appendChild(card);

        mainContainer.innerHTML = '';
        mainContainer.appendChild(container);
        
        const { default: addEditClient } = await import("../../../../../features/client/ui/add-edit-client/addEditClientJS.js");
        await addEditClient({cID, primaryKey, clientInfo, manageClient, manageUser, componentId: COMPONENT_ID});

        return () => removeListeners(COMPONENT_ID);
    }
    catch (err) {
        const { AppError } = await import("../../../../errors/models/AppError.js");
        AppError.process(err, {
            errorCode: AppError.Types.RENDER_ERROR,
            userMessage: AppError.BaseMessages.system.render,
        }, true);
    }
}