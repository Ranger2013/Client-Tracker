export default function userDataStructureConfig({
	validationToken = null,
	req = null}) {
	const baseStructure = {
		color_options: {},
		date_time: {},
		farrier_prices: {},
		installApp: {
			status: "default", // "no","installed","never" after selection
			timestamp: 0
		},
		mileage_charges: {
			range: [],
			per_mile: {
				base_cost: null,
				starting_mile: null,
				cost_per_mile: null,
			},
		},
		notifications: {
			status: "default", // "on" or "off" after selection
			timestamp: 0
		},
		reminders: {
			status: "default", // "on" or "off" after selection
			timestamp: 0
		},
		schedule_options: {},
	};

	return validationToken && req ? {
		...baseStructure,
		userToken: validationToken,
		user_status: { uID: req.uID, status: req.member_status, expiry: req.account_expiry }
	} : baseStructure;
};
