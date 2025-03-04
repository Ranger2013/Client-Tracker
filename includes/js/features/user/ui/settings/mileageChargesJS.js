import ManageUser from "../../models/ManageUser";
import handleRadioButtonSelect from "./components/mileage-charges/handleRadioButtonSelect";
import handlePerMileFormSubmission from "./components/mileage-charges/handlePerMileFormSubmission";
import handleByRangeFormSubmission from "./components/mileage-charges/handleByRangeFormSubmission";
import { addListener } from "../../../../core/utils/dom/listeners";

const COMPONENT_ID = 'mileage-charges';
const manageUser = new ManageUser();

// DOM Elements
const byRangeRadioButton = document.getElementById('per-range');
const byPerMileRadioButton = document.getElementById('per-mile');
const byRangeContainer = document.getElementById('by-range-container');
const byMileContainer = document.getElementById('by-mile-container');

// Initialize radio handling
await handleRadioButtonSelect({
    rangeButton: byRangeRadioButton,
    mileButton: byPerMileRadioButton,
    rangeContainer: byRangeContainer,
    mileContainer: byMileContainer,
    manageUser,
    componentId: COMPONENT_ID}
);

// Add form submission listeners
addListener({
    elementOrId: 'per-mile-form',
    eventType: 'submit',
    handler: evt => handlePerMileFormSubmission({evt, manageUser}),
    componentId: COMPONENT_ID
})

addListener({
    elementOrId: 'by-range-form',
    eventType: 'submit',
    handler: evt => handleByRangeFormSubmission({evt, manageUser}),
    componentId: COMPONENT_ID
});
