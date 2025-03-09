import { ucwords } from '../../../../../core/utils/string/stringUtils';

export default async function validateCity({evt}){
	try{
		// City cannot be empty
		if(!evt.target.value) return 'City cannot be empty.';

		// Format the input values
		evt.target.value = ucwords(evt.target.value);
		return;
	}
	catch(err){
		throw err;
	}
}