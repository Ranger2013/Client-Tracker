import { clearMsg } from '../../../../../core/utils/dom/messages';

export default async function validateState({ evt }) {
	try {
		// List of states
		// List of all 50 US States and abbreviations
		const states = {
			'Alabama': 'AL',
			'Alaska': 'AK',
			'Arizona': 'AZ',
			'Arkansas': 'AR',
			'California': 'CA',
			'Colorado': 'CO',
			'Connecticut': 'CT',
			'Deleware': 'DE',
			'Florida': 'FL',
			'Georgia': 'GA',
			'Hawaii': 'HI',
			'Idaho': 'ID',
			'Illinois': 'IL',
			'Indiana': 'IN',
			'Iowa': 'IA',
			'Kansas': 'KS',
			'Kentucky': 'KY',
			'Louisiana': 'LA',
			'Maine': 'ME',
			'Maryland': 'MD',
			'Massachusetts': 'MA',
			'Michigan': 'MI',
			'Minnesota': 'MN',
			'Mississippi': 'MS',
			'Missouri': 'MO',
			'Montana': 'MT',
			'Nebraska': 'NE',
			'Nevada': 'NV',
			'New Hampshire': 'NH',
			'New Jersey': 'NJ',
			'New Mexico': 'NM',
			'New York': 'NY',
			'North Carolina': 'NC',
			'North Dakota': 'ND',
			'Ohio': 'OH',
			'Oklahoma': 'OK',
			'Oregon': 'OR',
			'Pennsylvania': 'PA',
			'Rhode Island': 'RI',
			'South Carolina': 'SC',
			'South Dakota': 'SD',
			'Tennessee': 'TN',
			'Texas': 'TX',
			'Utah': 'UT',
			'Vermonth': 'VT',
			'Virginia': 'VA',
			'Washington': 'WA',
			'West Virginia': 'WV',
			'Wisconsin': 'WI',
			'Wyoming': 'WY'
		};

		for (const state in states) {
			if (evt.target.value.toUpperCase() === states[state].toUpperCase() || evt.target.value.toUpperCase() === state.toUpperCase()) {
				evt.target.value = states[state];
				clearMsg({container: `${evt.target.id}-error`, hide: true, input: `${evt.target.id}`}); // clear the error if we find a match
				return;
			}
		}
		return 'State not recognized.';
	}
	catch (err) {
		throw err;
	}
}