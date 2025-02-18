import buildTwoColumnInputSection from "../../../../helpers/buildTwoColumnInputSection.js";
import buildTwoColumnAddressSection from "../../../../helpers/buildTwoColumnAddressSection.js";
import buildTwoColumnSelectElementSection from "../../../../helpers/buildTwoColumnSelectElementSection.js";
import buildTwoColumnRadioButtonSection from "../../../../helpers/buildTwoColumnRadioButtonSection.js";
import { trimCycleConfigurations } from "../../../../../configurations/trimCycleConfigurations.js";

export default async function buildFormFields(formData = {}) {
    try {
        return await Promise.all([
            // Client name
            buildTwoColumnInputSection({
                labelText: 'Client Name:',
                inputID: 'client-name',
                inputType: 'text',
                inputName: 'client_name',
                inputValue: formData.client_name
            }),
            // Address section
            buildTwoColumnAddressSection('Address:', 'street', [
                /* ...address fields config... */
            ]),
            // Other fields...
            /* ...existing field configurations... */
        ]);
    } catch (err) {
        const { default: errorLogs } = await import("../../../../../utils/error-messages/errorLogs.js");
        await errorLogs('buildFormFieldsError', 'Build form fields error:', err);
        throw err;
    }
}
