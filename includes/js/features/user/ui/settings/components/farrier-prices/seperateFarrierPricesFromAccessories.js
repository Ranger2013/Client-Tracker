// Set up debug mod
const COMPONENT = 'Seperate Farrier Prices';
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function separateFarrierPricesFromAccessories(userData) {
	try {
		 // Initialize accessories structure
		 const initialAccessoriesStructure = {
			  pads: [],
			  packing: [],
			  wedges: [],
			  rockers: [],
			  clips: [],
			  casting: [],
			  sedation: []
		 };

		 // Extract farrier prices (shoes and trims)
		 const farrierPrices = Object.entries(userData)
			  .filter(([key]) => key.includes('shoes') || key.includes('trim'))
			  .reduce((acc, [key, value]) => ({
					...acc,
					[key]: value || ''
			  }), {});

		 // Process accessories
		 const processedAccessories = Object.entries(userData)
			  .filter(([key]) => !key.includes('shoes') && !key.includes('trim'))
			  .reduce((acc, [key, value]) => {
					const [prefix, type, index] = key.split('_');
					
					// Handle single-value accessories
					if (!type) {
						 if (value && initialAccessoriesStructure.hasOwnProperty(prefix)) {
							  acc[prefix] = [{
									cost: value
							  }];
						 }
						 return acc;
					}

					// Handle multi-value accessories
					if (index && initialAccessoriesStructure.hasOwnProperty(prefix)) {
						 if (!acc[prefix]) {
							  acc[prefix] = [];
						 }

						 const groupIndex = parseInt(index) - 1;
						 if (!acc[prefix][groupIndex]) {
							  acc[prefix][groupIndex] = {};
						 }

						 // Map the type to the correct property name
						 const propertyName = type === 'name' ? 'name' : 'cost';
						 acc[prefix][groupIndex][propertyName] = value.trim();
					}

					return acc;
			  }, initialAccessoriesStructure);

		 // Combine results
		 return {
			  ...farrierPrices,
			  accessories: processedAccessories
		 };
	}
	catch (err) {
		 const { AppError } = await import("../../../../../../core/errors/models/AppError.js");
		 AppError.process(err, {
			  errorCode: AppError.Types.FORM_SUBMISSION_ERROR,
			  userMessage: AppError.BaseMessages.forms.submissionFailed,
			  displayTarget: 'form-msg',
		 }, true);
	}
}
