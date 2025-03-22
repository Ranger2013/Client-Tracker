import { clearMsg } from '../../../../../core/utils/dom/messages.min.js';
import { matchesDateSearch } from './dateSearch.min.js';

export async function handleSearch({evt, manageUser}) {
    try {
        // Clear the "Searching..." message when search completes
        clearMsg({container: 'page-msg'});

        // Synchronous validations
        if (!evt?.target?.value && evt.target.value !== '') {
            throw new Error('Invalid event or missing target value');
        }

        const searchType = document.getElementById('filter')?.value || 'client-name';
        const searchText = evt.target.value.toLowerCase();
        const clientList = document.getElementById('appointment-list');
        
        if (!clientList) {
            throw new Error('Could not find appointment-list element');
        }

        // Synchronous DOM operations
        const clientBlocks = Array.from(clientList.getElementsByClassName('w3-row'));
        
        // Use Promise.all since we're doing multiple async operations
        await Promise.all(clientBlocks.map(async block => {
            const searchElement = block.querySelector(`[data-search-type="${searchType}"]`);
            if (!searchElement) return;

            const searchValue = searchElement.dataset.searchValue;
            const isVisible = searchType === 'app-date' 
                ? await matchesDateSearch({searchText, searchValue, manageUser})
                : searchValue.toLowerCase().includes(searchText);

            block.style.display = isVisible ? '' : 'none';
        }));

    }
	 catch (err) {
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.INITIALIZATION_ERROR,
			userMessage: 'Search functionality not available at the moment.'
		}, true);
    }
}
