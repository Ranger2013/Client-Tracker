import { clearMsg } from "../../../../utils/dom/domUtils.js";
import { addListener } from "../../../../utils/event-listeners/listeners.js";
import listenForFuelRangeInput from "./listenForFuelRangeInput.js";

const COMPONENT_ID = 'fuel-charges-radio';
const RANGE_INPUT_ID = 'fuel-range-input';

export default function handleRadioButtonSelect(range, rangeContainer, mile, mileContainer, manageUser) {
    const sections = {
        byRange: {
            radio: range,
            container: rangeContainer,
            show: async () => {
                clearMsg({ container: 'form-msg' });
                mileContainer.classList.add('w3-hide');
                rangeContainer.classList.remove('w3-hide');
                
                // This triggers listenForFuelRangeInput which then triggers buildMileageRangeInputs
                await listenForFuelRangeInput({userClass: manageUser, rangeContainer, rangeInputId: RANGE_INPUT_ID});
            }
        },
        byMile: {
            radio: mile,
            radio: mile,
            container: mileContainer,
            show: async () => {
                clearMsg({ container: 'form-msg' });
                rangeContainer.classList.add('w3-hide');
                mileContainer.classList.remove('w3-hide');

                const { default: populateByMileForm } = await import("./populateByMileForm.js");
                await populateByMileForm({form: 'per-mile-form', manageUser});
            }
        }
    };

    // Add radio button listeners
    Object.values(sections).forEach(section => {
        addListener(
            section.radio,
            'click',
            section.show,
            COMPONENT_ID
        );
    });
}