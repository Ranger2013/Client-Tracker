import { addListener } from "../../../../../../core/utils/dom/listeners.min.js";
import { clearMsg } from "../../../../../../core/utils/dom/messages.min.js";
import listenForFuelRangeInput from "./listenForFuelRangeInput.min.js";
import populateByMileForm from "./populateByMileForm.min.js";

const COMPONENT_ID = 'fuel-charges-radio';
const RANGE_INPUT_ID = 'fuel-range-input';

export default async function handleRadioButtonSelect({ rangeButton, mileButton, rangeContainer, mileContainer, manageUser, componentId }) {
    try {
        const sections = {
            byRange: {
                radio: rangeButton,
                container: rangeContainer,
                show: async () => {
                    clearMsg({ container: 'form-msg' });
                    mileContainer.classList.add('w3-hide');
                    rangeContainer.classList.remove('w3-hide');

                    // This triggers listenForFuelRangeInput which then triggers buildMileageRangeInputs
                    await listenForFuelRangeInput({ userClass: manageUser, rangeContainer, rangeInputId: RANGE_INPUT_ID });
                }
            },
            byMile: {
                radio: mileButton,
                container: mileContainer,
                show: async () => {
                    clearMsg({ container: 'form-msg' });
                    rangeContainer.classList.add('w3-hide');
                    mileContainer.classList.remove('w3-hide');

                    // Populate the per-mile form. It is currently hidden, but we need to populate it in case the user switches to it.
                    await populateByMileForm({ form: 'per-mile-form', manageUser });
                }
            }
        };

        // Add radio button listeners
        Object.values(sections).forEach(section => {
            addListener({
                elementOrId: section.radio,
                eventType: 'click',
                handler: section.show,
                componentId: COMPONENT_ID
            })
        });

        const mileageCharges = await manageUser.getMileageCharges();

        if (Array.isArray(mileageCharges) && mileageCharges.length > 0) {
            await listenForFuelRangeInput({ userClass: manageUser, rangeContainer, rangeInputId: RANGE_INPUT_ID });
            mileContainer.classList.add('w3-hide');
            rangeContainer.classList.remove('w3-hide');
            rangeButton.checked = true;
        }
        else {
            await populateByMileForm({ form: 'per-mile-form', manageUser });
            rangeContainer.classList.add('w3-hide');
            mileContainer.classList.remove('w3-hide');
            mileButton.checked = true;
        }

    }
    catch (err) {
        console.log('Error in handleRadioButtonSelect: ', err);
    }
}