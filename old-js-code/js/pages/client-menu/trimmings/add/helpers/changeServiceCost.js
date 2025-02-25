
export default async function changeServiceCost(evt, iterator) {
	const newServiceCost = evt.target.value; // input element value
	const serviceCostSelect = document.getElementById(`service-cost-${iterator}`); // Select element
	const originalCost = serviceCostSelect.options[serviceCostSelect.selectedIndex].value; // original select element value

	serviceCostSelect.options[serviceCostSelect.selectedIndex].value = `${originalCost.split(':')[0]}: ${newServiceCost}`;
}