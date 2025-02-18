
import { addListener } from "../../../../utils/event-listeners/listeners.js";

export default function makeInputsGreen(form){
	// Get the form inputs
	form.querySelectorAll('input').forEach(input => {
		// Add a listener to change input fields green on blur
		addListener(input, 'blur', (evt) => {
			if(evt.target.value !== ''){
				evt.target.classList.add('w3-light-green');
			}
			else {
				evt.target.classList.remove('w3-light-green');
			}
		});

		// Add a listener to remove the green while the user adjusts the input
		addListener(input, 'focus', (evt) => {
			evt.target.classList.remove('w3-light-green');
		});

		// Check if input values are already populated. if they are turn them green
		if(input.value !== ''){
			input.classList.add('w3-light-green');
		}
	});	
}