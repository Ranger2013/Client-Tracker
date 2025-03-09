import { clearMsg } from '../../../../../core/utils/dom/messages';
import { isNumeric } from '../../../../../core/utils/validation/validators';

export default async function validateZip({evt}){
	try{
		let value = evt.target.value;

		if(!value){
			clearMsg({container: `${evt.target.id}-error`, hide: true, input: `${evt.target.id}`});
			return;
		}
		
		if(value.length > 0 && value.length < 5){
			return 'Zip code must have 5 numbers.'
		}
		
		if(value.length > 5){
			return 'Please use the 5 digit zip code.';
		}
		
		if(!isNumeric(value, true)){
			return 'Only numbers are allowed in the zip code.';
		}
	}
	catch(err){
		throw err;
	}
}