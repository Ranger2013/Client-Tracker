// Example of combined utilities rather than separate files
export const dom = {
    create(config) { /* ... */ },
    append(parent, ...children) { /* ... */ },
    addClass(element, ...classes) { /* ... */ },
    removeClass(element, ...classes) { /* ... */ },
    // Combine related DOM operations in one file
};

// Example of feature-based organization
// filepath: /home/darklord/public_html/includes/js/features/clients/clientList.js
import { dom } from './dom.js';
import { AppError, ErrorTypes } from '../errors.js';

export const clientList = {
    async build(config) { /* ... */ },
    async update(data) { /* ... */ },
    async filter(criteria) { /* ... */ },
    // Related functionality together
};
