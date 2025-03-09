import { ucwords } from '../../../../../core/utils/string/stringUtils';

export default async function validateStreet({evt}){
	try{
		evt.target.value = ucwords(evt.target.value);
		if(evt.target.value === '') return 'Street address cannot be empty.';
	}
	catch(err){
		throw err;
	}
}