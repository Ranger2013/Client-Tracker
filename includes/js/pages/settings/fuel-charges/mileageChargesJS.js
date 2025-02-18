
import handleRadioButtonSelect from "./helpers/handleRadioButtonSelect.js";
import setupBackupNotice from "../../../utils/backup-notice/backupNotice.js";

// DOM Elements
const byRange = document.getElementById('per-range'); // Radio button for mileage ranges
const byRangeContainer = document.getElementById('by-range-container'); // Toggle to show the fuel ranges input
const byPerMile = document.getElementById('per-mile'); // Radio button for the cost per mile
const byMileContainer = document.getElementById('by-mile-container'); // Toggle to show the starting mile and cost per mile
const perMileSubmitButton = document.getElementById('per-mile-submit-button-container'); // The container we will need to build a submit button for to prevent duplicate submit-button id's on the page

// Set the back-up data reminder
setupBackupNotice();

// This will add event listeners to the radio buttons.
// It will then handle getting which section to open
// It handles all the UI for the mileage ranges and adds a submit button for perMileForm
handleRadioButtonSelect(byRange, byRangeContainer, byPerMile, byMileContainer, perMileSubmitButton); // Adds event listeners to the radio buttons, and will display the appropriate page
