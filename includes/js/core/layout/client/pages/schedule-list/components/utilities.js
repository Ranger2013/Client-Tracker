import { buildEle } from '../../../../../utils/dom/elements.js';

export function buildElementsFromConfig(config) {
	return Object.entries(config).reduce((acc, [key, value]) => {
		acc[key] = buildEle(value);
		return acc;
	}, {});
}

