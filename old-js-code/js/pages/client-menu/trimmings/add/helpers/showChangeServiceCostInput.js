
import { addListener } from "../../../../../utils/event-listeners/listeners.js";
import changeServiceCost from "./changeServiceCost.js";

export default async function showChangeServiceCostInput({evt, iterator, blockElementNode = null}) {
	// DOM Elements
	const changeServiceCostContainer = document.getElementById(`change-cost-container-${iterator}`) ?? blockElementNode.querySelector(`#change-cost-container-${iterator}`);
	const changeCostInput = document.getElementById(`cost-change-${iterator}`) ?? blockElementNode.querySelector(`#cost-change-${iterator}`);
	const serviceCostSelect = document.getElementById(`service-cost-${iterator}`) ?? blockElementNode.querySelector(`#service-cost-${iterator}`);

	// Toggle disabled
	changeCostInput.disabled = !changeCostInput.disabled;

	// Put the selected index cost in the input field
	changeCostInput.value = serviceCostSelect.options[serviceCostSelect.selectedIndex].value.split(':')[1].trim();

	// Toggle the hide class
	changeServiceCostContainer.classList.toggle('w3-hide');

	// This event listener is to listen for the value of the service cost input field
	addListener(`cost-change-${iterator}`, 'input', async (evt) => {
		await changeServiceCost(evt, iterator);
	});
}