import { buildElementTree } from '../../../../../../utils/dom/elements.js';

export default function buildHorseTypesWidget(processData) {
	const { horseTypes, totalActiveHorses } = processData;

	const totalDisplayHorses = totalActiveHorses;

	// Define colors for different horse types
	const typeColors = {
		'draft': '#76b7b2',
		'horse': '#4e79a7',
		'mule': '#af7aa1',
		'donkey': '#f28e2c',
		'mini_donkey': '#59a14f',
		'pony': '#e15759',
		'mini_pony': '#edc949'
	};

	// Calculate percentages and prepare data for pie chart
	const typeData = Object.entries(horseTypes)
		.filter(([_, count]) => count > 0)
		.map(([type, count]) => ({
			type,
			count,
			rawPercentage: (count / totalDisplayHorses) * 100
		}))
		.sort((a, b) => b.count - a.count);

	// Calculate normalized percentages that add to 100%
	const totalPerc = typeData.reduce((sum, item) => sum + Math.max(1, Math.round(item.rawPercentage)), 0);
	const scale = totalPerc > 100 ? 100 / totalPerc : 1;

	// Assign the final percentages
	typeData.forEach(item => {
		// Ensure minimum 1% for non-zero counts, but scale overall to 100%
		item.percentage = Math.round(Math.max(1, Math.round(item.rawPercentage)) * scale);
	});

	let currentTotal = typeData.reduce((sum, item) => sum + item.percentage, 0);
	let diff = 100 - currentTotal;

	// Distribute any remaining difference to larget types first
	if (diff !== 0) {
		// Sort by count for adjusment (largest first)
		typeData.sort((a, b) => b.count - a.count);

		let i = 0;
		while (diff !== 0 && i < typeData.length) {
			// Add or subtract 1% as needed
			typeData[i].percentage += diff > 0 ? 1 : -1;
			diff += diff > 0 ? -1 : 1;
			i++;
		}

		// Re-sort by count for display
		typeData.sort((a, b) => b.count - a.count);
	}
	// Generate SVG pie chart sections
	const pieChartSlices = generatePieChartSlices(typeData, typeColors);

	// Build widget structure using buildElementTree
	const horsesTypesTree = {
		type: 'div',
		children: [
			// Header card
			{
				type: 'div',
				myClass: ['w3-card', 'w3-round', 'w3-margin-bottom'],
				children: [
					{
						type: 'h4',
						myClass: ['w3-center'],
						text: 'Horse Types Distribution'
					},
					{
						type: 'div',
						myClass: ['w3-center'],
						text: `<strong>Total Horses:</strong> ${totalDisplayHorses}`
					}
				]
			},
			// Chart container
			{
				type: 'div',
				myClass: ['w3-card', 'w3-round', 'w3-padding-small', 'w3-margin-bottom', 'w3-center'],
				children: [
					{
						type: 'div',
						myClass: ['w3-center'],
						attributes: {
							id: 'pie-chart-container',
							style: 'max-width: 350px; margin: 0 auto;'
						},
						text: `
									<svg viewBox="0 0 100 100" class="w3-center">
										 <!-- Pie slices -->
										 ${pieChartSlices.pathsHTML}
										 <!-- Center circle (optional for donut chart) -->
										 <circle cx="50" cy="50" r="25" fill="white"></circle>
										 <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" 
												 font-size="6" font-weight="bold">Horse Types</text>
									</svg>
							  `
					}
				]
			},
			// Legend container
			{
				type: 'div',
				myClass: ['w3-card', 'w3-round', 'w3-padding-small'],
				children: [
					{
						type: 'div',
						myClass: ['w3-row'],
						children: buildLegendItems(typeData, typeColors)
					}
				]
			}
		]
	};

	return buildElementTree(horsesTypesTree);
}

// Helper function to generate SVG pie chart slices
function generatePieChartSlices(data, colors) {
	let startAngle = 0;
	const paths = [];
	const radius = 40;
	const cx = 50;
	const cy = 50;

	data.forEach(item => {
		if (item.count === 0) return;

		// Calculate angles
		const angle = (item.percentage / 100) * 360;
		const endAngle = startAngle + angle;

		// Convert angles to radians
		const startRad = (startAngle - 90) * Math.PI / 180;
		const endRad = (endAngle - 90) * Math.PI / 180;

		// Calculate coordinates
		const x1 = cx + radius * Math.cos(startRad);
		const y1 = cy + radius * Math.sin(startRad);
		const x2 = cx + radius * Math.cos(endRad);
		const y2 = cy + radius * Math.sin(endRad);

		// Determine arc sweep
		const largeArcFlag = angle > 180 ? 1 : 0;

		// Create SVG path
		const path = `
			  <path 
					d="M ${cx},${cy} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2} Z" 
					fill="${colors[item.type] || '#ccc'}"
					stroke="white" 
					stroke-width="0.5"
			  ></path>
		 `;
		paths.push(path);

		startAngle = endAngle;
	});

	return { pathsHTML: paths.join('') };
}

// Helper function to build legend items
function buildLegendItems(data, colors) {
	return data.map(item => ({
		type: 'div',
		myClass: ['w3-col', 's6', 'm4'],
		children: [
			{
				type: 'div',
				myClass: ['w3-padding-small'],
				children: [
					{
						type: 'span',
						attributes: {
							style: `display:inline-block; width:15px; height:15px; background-color:${colors[item.type]}; margin-right:5px; border-radius:2px; vertical-align:middle;`
						},
					},
					{
						type: 'span',
						myClass: ['w3-small'],
						text: `${formatHorseType(item.type)}: `
					},
					{
						type: 'div',
						myClass: ['w3-indent', 'w3-small'],
						text: `${item.count} (${item.percentage}%)`
					}
				]
			}
		]
	}));
}

// Helper to format horse type names
function formatHorseType(type) {
	return type
		.split('_')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

