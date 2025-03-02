import { addListener, removeListeners } from "../../../../../../core/utils/dom/listeners.js";
import buildMileageRangeInputs from "./buildMileageRangeInputs.js";

export default async function listenForFuelRangeInput({ userClass, rangeContainer, rangeInputId }) {
    const rangeInput = document.getElementById('fuel-ranges');
    const fuelRangeContainer = document.getElementById('fuel-range-container');

    try {
        const mileageCharges = await userClass.getMileageCharges();

        // Remove existing listeners
        removeListeners(rangeInputId);

        addListener({
            elementOrId: rangeInput,
            eventType: 'input',
            handler: evt => buildMileageRangeInputs({ evt, rangeContainer, fuelRangeContainer, values: mileageCharges, componentId: rangeInputId }),
            componentId: rangeInputId
        });

        // This auto calls the event listener to build the range inputs
        if (mileageCharges?.length > 0) {
            rangeInput.value = mileageCharges.length;
            rangeInput.dispatchEvent(new Event('input', {
                bubbles: true,
                cancelable: true
            }));
        }
    }
    catch (err) {
        const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
        new AppError('Error listening for fuel range input: ', {
            originalError: err,
            shouldLog: true,
            userMessage: 'Could not load fuel range inputs.',
            errorCode: 'RENDER_ERROR',
            displayTarget: fuelRangeContainer,
        }).handle();
    }
}