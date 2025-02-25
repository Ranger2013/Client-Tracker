export function trimCycleConfigurations(fieldValues = null) {
	return [
		{ value: 'null', text: '-- Trim Cycle --' },
		{ value: '7', text: 'One Week', selected: (fieldValues?.trim_cycle === '7') ? 'selected' : null },
		{ value: '14', text: 'Two Weeks', selected: (fieldValues?.trim_cycle === '14') ? 'selected' : null },
		{ value: '21', text: 'Three Weeks', selected: (fieldValues?.trim_cycle === '21') ? 'selected' : null },
		{ value: '28', text: 'Four Weeks', selected: (fieldValues?.trim_cycle === '28') ? 'selected' : null },
		{ value: '35', text: 'Five Weeks', selected: (fieldValues?.trim_cycle === '35') ? 'selected' : null },
		{ value: '42', text: 'Six Weeks', selected: (fieldValues?.trim_cycle === '42') ? 'selected' : null },
		{ value: '49', text: 'Seven Weeks', selected: (fieldValues?.trim_cycle === '49') ? 'selected' : null },
		{ value: '56', text: 'Eight Weeks', selected: (fieldValues?.trim_cycle === '56') ? 'selected' : null },
		{ value: '63', text: 'Nine Weeks', selected: (fieldValues?.trim_cycle === '63') ? 'selected' : null },
		{ value: '70', text: 'Ten Weeks', selected: (fieldValues?.trim_cycle === '70') ? 'selected' : null },
	];
} 
