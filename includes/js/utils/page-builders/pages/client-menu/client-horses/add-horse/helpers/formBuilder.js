import { buildEle } from "../../../../../../../dom/domUtils.js";
import buildTwoColumnInputSection from "../../../../../../helpers/buildTwoColumnInputSection.js";
import buildSubmitButtonSection from "../../../../../../helpers/buildSubmitButtonSection.js";

const FORM_CONFIG = {
    id: 'add-horse-form',
    role: 'form',
    ariaLabel: 'Add new horse',
    input: {
        labelText: 'Name of Horse: ',
        id: 'horse-name',
        type: 'text',
        name: 'horse_name',
        title: "Horse's Name",
        required: true
    }
};

export async function buildAddHorseForm() {
    try {
        const [horseInput, submit] = await Promise.all([
            buildTwoColumnInputSection(FORM_CONFIG.input),
            buildSubmitButtonSection('Add New Horse')
        ]);

        const form = buildEle({
            type: 'form',
            attributes: {
                id: FORM_CONFIG.id,
                role: FORM_CONFIG.role,
                'aria-label': FORM_CONFIG.ariaLabel,
            }
        });

        form.appendChild(horseInput);
        form.appendChild(submit);

        return form;
    } catch (err) {
        const { default: errorLogs } = await import("../../../../../../../../utils/error-messages/errorLogs.js");
        await errorLogs('buildAddHorseFormError', 'Build add horse form error: ', err);
        throw err;
    }
}
