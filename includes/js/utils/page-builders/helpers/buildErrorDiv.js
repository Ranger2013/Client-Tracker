import { buildEle } from "../../dom/domUtils.js";

export default function buildErrorDiv(id){
	const errorDiv = buildEle({
		type: 'div',
		attributes: {id: `${id}-error`},
		myClass: ['w3-padding-small', 'w3-margin-small', 'w3-hide'],
	});
	return errorDiv;
}