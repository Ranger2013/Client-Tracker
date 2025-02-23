import { addListener, removeListeners } from "../../../../utils/event-listeners/listeners.js";
import buildMileageRangeInputs from "./buildMileageRangeInputs.js";

export default async function listenForFuelRangeInput({userClass, rangeContainer, rangeInputId}) {
    const rangeInput = document.getElementById('fuel-ranges');
    const fuelRangeContainer = document.getElementById('fuel-range-container');
    
    const mileageCharges = await userClass.getMileageCharges();

    // Remove existing listeners
    removeListeners(rangeInputId);

    addListener(
        rangeInput, 
        'input', 
        evt => buildMileageRangeInputs({evt, rangeContainer, fuelRangeContainer, values: mileageCharges, componentId: rangeInputId}),
        rangeInputId
    );

    if (mileageCharges?.length > 0) {
        rangeInput.value = mileageCharges.length;
        rangeInput.dispatchEvent(new Event('input', { 
            bubbles: true, 
            cancelable: true 
        }));
    }
}