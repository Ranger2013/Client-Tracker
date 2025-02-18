import { clearMsg } from '../../../../utils/dom/domUtils.js';
import { matchesDateSearch } from './dateSearch.js';

export async function handleSearch(evt) {
    try {
        // Clear the "Searching..." message when search completes
        clearMsg({container: 'page-msg'});

        // Synchronous validations
        if (!evt?.target?.value && evt.target.value !== '') {
            throw new Error('Invalid event or missing target value');
        }

        const searchType = document.getElementById('filter')?.value || 'client-name';
        const searchText = evt.target.value.toLowerCase();
        const clientList = document.getElementById('schedule-list');
        
        if (!clientList) {
            throw new Error('Could not find schedule-list element');
        }

        // Synchronous DOM operations
        const clientBlocks = Array.from(clientList.getElementsByClassName('w3-row'));
        
        // Use Promise.all since we're doing multiple async operations
        await Promise.all(clientBlocks.map(async block => {
            const searchElement = block.querySelector(`[data-search-type="${searchType}"]`);
            if (!searchElement) return;

            const searchValue = searchElement.dataset.searchValue;
            const isVisible = searchType === 'app-date' 
                ? await matchesDateSearch(searchText, searchValue)
                : searchValue.toLowerCase().includes(searchText);

            block.style.display = isVisible ? '' : 'none';
        }));

    } catch (err) {
        const { default: errorLogs } = await import("../../../../utils/error-messages/errorLogs.js");
        await errorLogs('handleSearchError', 'Search operation failed:', err);
    }
}
