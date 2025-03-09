import { clearMsg } from '../../../../../core/utils/dom/messages';
import { isNumeric } from '../../../../../core/utils/validation/validators';

export default async function validateDistance({evt}){
	try{
		if(!evt.target.value){
			clearMsg({container: `${evt.target.id}-error`, hide: true, input: evt.target.id});
			return;
		}

		if(!isNumeric(evt.target.value, true)){
			return 'Distance must by a number.';
		}
	}
	catch(err){
		throw err;
	}
}