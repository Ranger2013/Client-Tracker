export const PAGE_CONFIG = {
    filterOptions: [
        { value: 'client-name', text: 'Search By Client Name' },
        { value: 'address', text: 'Search By Address' },
        { value: 'phone', text: 'Search By Phone' },
        { value: 'app-time', text: 'Search By Time' },
        { value: 'app-date', text: 'Search By Date' }
    ],
    container: {
        type: 'div',
        class: ['w3-container']
    },
    formMsg: {
        type: 'div',
        class: ['w3-center']
    },
    counter: {
        type: 'div',
        class: ['w3-small']
    }
};
