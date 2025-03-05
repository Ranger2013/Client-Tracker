/**
 * @typedef {Object} MileageRangeFormData
 * @property {string} fuel_ranges - Number of ranges to process
 * @property {Object.<string, string>} - Dynamic properties in format:
 *    - mileage_range_[1-n]: string (e.g., "51-60")
 *    - fuel_cost_[1-n]: string (e.g., "10")
 */

/**
 * @typedef {Object} PerMileFormData
 * @property {string} starting_mile - Starting mileage
 * @property {string} cost_per_mile - Cost per mile
 * @property {string} [base_cost] - Optional base cost
 */

/**
 * Adds fuel charges to user settings based on form submission type
 * 
 * @param {Object} params - Function parameters
 * @param {MileageRangeFormData|PerMileFormData} params.userData - Form data. Structure varies based on formType
 * @param {'range'|'mile'} params.formType - Determines how form data is processed
 *    - 'range': Processes multiple mileage ranges with associated costs
 *    - 'mile': Processes single per-mile cost structure
 * @param {Object} params.manageUser - ManageUser instance for data persistence
 * @returns {Promise<boolean>} True if operation successful
 * 
 * @example
 * // Range-based submission
 * addFuelCharges({
 *   userData: {
 *     fuel_ranges: "3",
 *     mileage_range_1: "51-60",
 *     fuel_cost_1: "10",
 *     // ... additional ranges
 *   },
 *   formType: 'range',
 *   manageUser
 * });
 * 
 * @example
 * // Per-mile submission
 * addFuelCharges({
 *   userData: {
 *     starting_mile: "50",
 *     cost_per_mile: "1.5",
 *     base_cost: "25"
 *   },
 *   formType: 'mile',
 *   manageUser
 * });
 */
export async function addFuelCharges({ userData, formType, manageUser }) {
    try{
        const mileageCharges = await buildMileageStructure({ formType, userData });

        return await handleMileageChargesIDBOoperation({ userData: mileageCharges, manageUser });
    }
    catch(err){
        const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
            userMessage: 'Failed to add fuel charges',
            displayTarget: 'form-msg',
        });
        return false;
    }
}

// Helper function for data transformation
async function buildRangeData({ userData }) {
    try {
        return Array.from(
            { length: parseInt(userData.fuel_ranges, 10) },
            (_, i) => ({
                range: userData[`mileage_range_${i + 1}`],
                cost: userData[`fuel_cost_${i + 1}`]
            })
        );
    }
    catch (err) {
        const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
        AppError.process(err, {
            errorCode: AppError.Types.DATA_ERROR,
            userMessage: 'Failed to build range data',
            displayTarget: 'form-msg',
        }, true);
    }
}

/**
 * Builds the data structure for mileage charges to be inserted into the IDB
 * 
 * @param {String} formType - Type of structure to build. Either 'range' or 'mile'
 * @param {Object} userData - Form data
 * @param {String} userData.starting_mile - Starting mile
 * @param {String} userData.cost_per_mile - Cost per mile
 * @param {String} userData.base_cost - Base cost (optional) 
 * @returns {Promise<Object>} - Mileage structure
 * @throws {Error} - Invalid form type
 */
async function buildMileageStructure({ formType, userData }) {
    if (formType !== 'range' && formType !== 'mile') {
        throw new Error('Invalid form type');
    }

    const structures = {
        range: {
            per_mile: { starting_mile: null, cost_per_mile: null, base_cost: null },
            range: await buildRangeData({ userData })
        },
        mile: {
            per_mile: {
                starting_mile: userData.starting_mile,
                cost_per_mile: userData.cost_per_mile,
                base_cost: userData?.base_cost || null
            },
            range: []
        }
    };

    return structures[formType];
}

async function handleMileageChargesIDBOoperation({ userData, manageUser }) {
    try {
        const stores = manageUser.getStoreNames();

        await manageUser.updateLocalUserSettings({
            userData: userData,
            settingsProperty: 'mileage_charges',
            backupStore: stores.MILEAGECHARGES,
            backupAPITag: 'add_fuelCosts'
        });

        return true;
    }
    catch (err) {
        const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
        AppError.process(err, {
            errorCode: AppError.Types.DATABASE_ERROR,
            userMessage: AppError.BaseMessages.system.generic,
            displayTarget: 'form-msg',
        }, true);
    }
}