import { addListener, removeListeners } from "../../../../../../core/utils/dom/listeners.min.js";
import buildMileageRangeInputs from "./buildMileageRangeInputs.min.js";

export default async function listenForFuelRangeInput({ userClass, rangeContainer, rangeInputId }) {
    const rangeInput = document.getElementById('fuel-ranges');
    const fuelRangeContainer = document.getElementById('fuel-range-container');

    try {        
        // Remove existing listeners
        removeListeners(rangeInputId);
        let mileageCharges = null;

        try {
            mileageCharges = await userClass.getMileageCharges();
        }
        catch(err) {
            const { AppError } = await import("../../../../../../core/errors/models/AppError.min.js");
            await AppError.handleError(err, {
                errorCode: AppError.Types.FORM_POPULATION_ERROR,
                userMessage: null,
            });
        }
        
        // Even if getMileageCharges fails, we still want to setup the listener
        // and allow user to input new ranges
        addListener({
            elementOrId: rangeInput,
            eventType: 'input',
            handler: async (evt) => {
                buildMileageRangeInputs({ evt, rangeContainer, fuelRangeContainer, values: mileageCharges, componentId: rangeInputId })
            },
            componentId: rangeInputId
        });

        // Only auto-populate if we got valid data
        if (mileageCharges?.length > 0) {
            rangeInput.value = mileageCharges.length;
            rangeInput.dispatchEvent(new Event('input', {
                bubbles: true,
                cancelable: true
            }));
        }
    }
    catch (err) {
        console.warn(err);  // Log any other errors but don't stop functionality
    }
}