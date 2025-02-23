import { addListener } from "../../../utils/event-listeners/listeners.js";
import ManageUser from "../../../classes/ManageUser.js";
import handleByRangeFormSubmission from "./handleByRangeFormSubmission.js";
import handlePerMileFormSubmission from "./handlePerMileFormSubmission.js";
import handleRadioButtonSelect from "./helpers/handleRadioButtonSelect.js";

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
