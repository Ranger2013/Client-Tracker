import { buildGenericSelectOptions } from "../../../../../utils/dom/buildGenericSelectOptions.js";
import buildHorseListSelectElements from "./showHorseListSelectElements.js";

// Cache for select options to avoid rebuilding them
const optionsCache = new Map();

export default async function autoFillHorseList({ totalHorses, optionsConfig }) {
    try {
        // Create a DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Pre-build options once if not cached
        const getCachedOptions = (config, cacheKey) => {
            const key = JSON.stringify(config);
            if (!optionsCache.has(key)) {
                optionsCache.set(key, buildGenericSelectOptions(config));
            }
            return optionsCache.get(key);
        };

        // Pre-build all options sets
        const options = {
            horseList: getCachedOptions(optionsConfig.horseListOptionsConfig, 'horseList'),
            farrierPrices: getCachedOptions(optionsConfig.farrierPricesOptionsConfig, 'farrierPrices'),
            accessories: getCachedOptions(optionsConfig.accessoryOptionsConfig, 'accessories')
        };

        // Build all blocks concurrently
        const blocks = await Promise.all(
            Array.from({ length: totalHorses }, async (_, i) => {
                const iterator = i + 1;
                
                const block = await buildHorseListSelectElements({
                    iterator,
                    horseListOptions: options.horseList,
                    farrierPricesOptions: options.farrierPrices,
                    accessoryOptions: options.accessories,
                });

                // Get and configure elements
                const horseList = block.querySelector(`#horse-list-${iterator}`);
                const servicesContainer = block.querySelector(`#services-container-${iterator}`);
                const checkboxContainer = block.querySelector(`#checkbox-container-${iterator}`);

                // Set selected index and show containers
                horseList.selectedIndex = iterator;
                [servicesContainer, checkboxContainer].forEach(
                    container => container?.classList.remove('w3-hide')
                );

                return block;
            })
        );

        // Append all blocks to fragment
        blocks.forEach(block => fragment.appendChild(block));
        return Array.from(fragment.children);

    }
	 catch (err) {
        const { helpDeskTicket } = await import("../../../../../utils/error-messages/errorMessages.js");
        const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
        
        await handleError(
            'autoFillHorseListError',
            'Auto fill horse list error: ',
            err,
            `We encountered an error. Unable to auto fill the horse list at this time.
             <br>Please try adding the horses one at a time.<br>${helpDeskTicket}`,
            'horse-list-container'
        );

        // Disable submit button and clear cache on error
        document.getElementById('submit-button').disabled = true;
        optionsCache.clear();
        return [];
    }
}

// Clear cache when module is unloaded
window.addEventListener('unload', () => optionsCache.clear());
