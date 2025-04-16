import { buildElementTree } from '../../../../../../utils/dom/elements.js';

export default function buildOverviewWidget(processData) {
	const {
		totalClients,
		totalActiveClients,
		totalInactiveClients,
		totalHorses,
		totalActiveHorses,
		totalInactiveHorses,
		clientsByHorseCount
	} = processData;

	// Calculate percentages
	const activeClientPercent = Math.round((totalActiveClients / totalClients) * 100) || 0;
	const inactiveClientPercent = Math.round((totalInactiveClients / totalClients) * 100) || 0;
	const activeHorsePercent = Math.round((totalActiveHorses / totalHorses) * 100) || 0;
	const inactiveHorsePercent = Math.round((totalInactiveHorses / totalHorses) * 100) || 0;

	// Create element tree structure
	const overviewTree = {
		type: 'div',
		children: [
			// Summary Section
			{
				type: 'div',
				myClass: ['w3-margin-bottom'],
				children: [
					// Client Card
					{
						type: 'div',
						myClass: ['w3-card', 'w3-round', 'w3-padding-small', 'w3-margin-bottom'],
						children: [
							{
								type: 'h4',
								myClass: ['w3-center'],
								text: 'Client Statistics',
							},
							{
								type: 'div',
								myClass: ['w3-row', 'w3-padding-small'],
								children: [
									{
										type: 'div',
										myClass: ['w3-col', 's12'],
										text: `<strong>Total Clients:</strong> ${totalClients}`,
									},
									{
										type: 'div',
										myClass: ['w3-col', 's12', 'w3-padding-small', 'w3-margin-left'],
										text: `<span>├─ Active: ${totalActiveClients} (${activeClientPercent}%)</span>`,
									},
									{
										type: 'div',
										myClass: ['w3-col', 's12', 'w3-padding-small', 'w3-margin-left'],
										text: `<span>└─ Inactive: ${totalInactiveClients} (${inactiveClientPercent}%)</span>`,
									},
								],
							},
						],
					},
					// Horse Card
					{
						type: 'div',
						myClass: ['w3-card', 'w3-round', 'w3-padding-small', 'w3-margin-bottom'],
						children: [
							{
								type: 'div',
								myClass: ['w3-row', 'w3-padding-small'],
								children: [
									{
										type: 'div',
										myClass: ['w3-col', 's12'],
										text: `<strong>Total Horses:</strong> ${totalHorses}`,
									},
									{
										type: 'div',
										myClass: ['w3-col', 's12', 'w3-padding-small', 'w3-margin-left'],
										text: `<span>├─ Active: ${totalActiveHorses} (${activeHorsePercent}%)</span>`,
									},
									{
										type: 'div',
										myClass: ['w3-col', 's12', 'w3-padding-small', 'w3-margin-left'],
										text: `<span>└─ Inactive: ${totalInactiveHorses} (${inactiveHorsePercent}%)</span>`,
									},
								],
							},
						],
					},
				],
			},
			// Distribution Card
			{
				type: 'div',
				myClass: ['w3-card', 'w3-round'],
				children: [
					{
						type: 'h4',
						myClass: ['w3-center'],
						text: 'Client Distribution',
					},
					{
						type: 'div',
						id: 'distribution-list',
						children: buildDistributionItems(clientsByHorseCount),
					},
				],
			},
		],
	};

	return buildElementTree(overviewTree);
}

// Helper function to build distribution items
function buildDistributionItems(clientsByHorseCount) {
	const sortedKeys = Object.keys(clientsByHorseCount)
		 .map(key => parseInt(key, 10))
		 .sort((a, b) => a - b);
	
	// Find the maximum client count for scaling
	const maxCount = Math.max(...sortedKeys.map(key => clientsByHorseCount[key].length));
	
	// Add a header explanation with click instruction
	const items = [{
		 type: 'div',
		 myClass: ['w3-padding-small'],
		 children: [
			  {
					type: 'div',
					text: 'Number of clients grouped by how many horses they own'
			  },
			  {
					type: 'div',
					myClass: ['w3-small', 'w3-text-grey', 'w3-padding-small'],
					text: 'Tap on any bar to view client details'
			  }
		 ]
	}];
	
	// Then add the bars with visual indicators
	const bars = sortedKeys.map(horseCount => {
		 const clients = clientsByHorseCount[horseCount];
		 const barWidth = Math.max(30, Math.round((clients.length / maxCount) * 100));
		 
		 return {
			  type: 'div',
			  myClass: ['w3-padding-small'],
			  children: [
					{
						 type: 'div',
						 myClass: ['w3-row'],
						 children: [
							  {
									type: 'div',
									myClass: ['w3-col', 's4', 'm3'],
									text: `Horses: ${horseCount}`
							  },
							  {
									type: 'div', 
									myClass: ['w3-col', 's8', 'm9'],
									children: [
										 {
											  type: 'div',
											  myClass: ['w3-light-grey', 'w3-round-small'],
											  children: [
													{
														 type: 'div',
														 attributes: {
															  'data-horses': horseCount,
															  style: `width:${barWidth}%; 
																	  background-color:#2196F3; 
																	  color:white; 
																	  padding:3px 8px;
																	  border:1px solid #1565c0;
																	  white-space:nowrap;
																	  overflow:hidden;
																	  text-overflow:ellipsis;
																	  cursor:pointer;`  // Add cursor indicator
														 },
														 myClass: ['w3-container', 'w3-round-small', 'w3-pointer', 'w3-hover-dark-gray'],
														 children: [
															  {
																	type: 'span',
																	text: `${clients.length} client${clients.length !== 1 ? 's' : ''}`
															  },
														 ]
													}
											  ]
										 }
									]
							  }
						 ]
					}
			  ]
		 };
	});
	
	return [...items, ...bars];
}