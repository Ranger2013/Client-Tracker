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
handleRadioButtonSelect(
    byRangeRadioButton,
    byRangeContainer,
    byPerMileRadioButton,
    byMileContainer,
    manageUser
);

// Add form submission listeners
addListener('per-mile-form', 'submit', 
    evt => handlePerMileFormSubmission({evt, manageUser}), 
    COMPONENT_ID
);
addListener('by-range-form', 'submit', 
    evt => handleByRangeFormSubmission({evt, manageUser}), 
    COMPONENT_ID
);
