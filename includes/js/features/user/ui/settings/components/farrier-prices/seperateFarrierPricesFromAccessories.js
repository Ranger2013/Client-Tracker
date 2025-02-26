import { isNumeric } from "../../../../../../core/utils/validation/validators.js";

export default function seperateFarrierPricesFromAccessories(userData) {
	try{
		const farrierPrices = {};
		const accessories = {
			pads: [],
			packing: [],
			wedges: [],
			rockers: [],
			clips: [],
			casting: [],
			sedation: [],
		};
	
		const myKeys = {
			pads: {
				name: {
					key: 'pads_name_',
					action: (index, value) => {
						accessories.pads[index - 1] = { ...accessories.pads[index - 1], name: value };
					}
				},
				cost: {
					key: 'pads_cost_',
					action: (index, value) => {
						accessories.pads[index - 1] = { ...accessories.pads[index - 1], cost: value };
					}
				}
			},
			packing: {
				name: {
					key: 'packing_name_',
					action: (index, value) => {
						accessories.packing[index - 1] = { ...accessories.packing[index - 1], name: value };
					}
				},
				cost: {
					key: 'packing_cost_',
					action: (index, value) => {
						accessories.packing[index - 1] = { ...accessories.packing[index - 1], cost: value };
					}
				}
			},
			wedges: {
				name: {
					key: 'wedges_name_',
					action: (index, value) => {
						accessories.wedges[index - 1] = { ...accessories.wedges[index - 1], name: value };
					}
				},
				cost: {
					key: 'wedges_cost_',
					action: (index, value) => {
						accessories.wedges[index - 1] = { ...accessories.wedges[index - 1], cost: value };
					}
				}
			},
			rockers: {
				cost: {
					key: 'rockers',
					action: (index, value) => {
						accessories.rockers = [{ cost: value }];
					}
				}
			},
			clips: {
				cost: {
					key: 'clips',
					action: (index, value) => {
						accessories.clips = [{ cost: value }];
					}
				}
			},
			casting: {
				cost: {
					key: 'casting',
					action: (index, value) => {
						accessories.casting = [{ cost: value }];
					}
				}
			},
			sedation: {
				cost: {
					key: 'sedation',
					action: (index, value) => {
						accessories.sedation = [{ cost: value }];
					}
				}
			}
		};
	
		// Loop through the form data
		for (let key in userData) {
			// Make sure that the key is a property of the userData
			if (userData.hasOwnProperty(key)) {
				// Key categories
				const [mainCategory, category, index] = key.split('_');

				// Check if this is an accessory
				if(myKeys[mainCategory]){
					// Get the subKey of the myKeys object, either 'name' or 'cost'. If no category or index, we know it is a single accessory name
					const subKey = (index === undefined && category === undefined) ? 'cost' : key.replace(`${mainCategory}_`, '').replace(`_${index}`, '');
					
					// Check if there is a subkey in myKeys. Not all subkeys have the name property. Make sure the userData input field is not empty
					if(myKeys[mainCategory][subKey] && userData[key] !== ''){
						myKeys[mainCategory][subKey].action(index, userData[key]); // This will add this to the accessories object
					}
				}
				// Not an accessory, add to the farrier prices object if it is numeric
				else {
					if(userData[key] !== '' && !isNumeric(userData[key], true)){
						const error = new Error('Farrier prices must be numeric.');
						error.isCustom = true;
						throw error;
					}
					farrierPrices[key] = userData[key];
				}
			}
		}
	
		farrierPrices.accessories = accessories;
		return farrierPrices;
	}
	catch(err){
		console.warn('seperate farrier prices from accessories error: ', err);		
		throw err;
	}
}