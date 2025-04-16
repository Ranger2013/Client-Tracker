import { buildElementTree } from '../../../core/utils/dom/elements.js';
import { addListener } from '../../../core/utils/dom/listeners.js';
import { safeDisplayMessage } from '../../../core/utils/dom/messages.js';

/**
 * Calendar class for managing interactive date selection
 * @class
 * @description Creates an interactive calendar that allows users to select dates and persist them
 * to user settings. The calendar supports month navigation, date selection, and bulk operations.
 */
export class Calendar {
    // Private fields must be declared up front
    #manageUser;
    #container;
    #selectedDates = [];
    #currentMonth;
    #currentYear;
    #componentId;
    #messageContainer;

    static #MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    /**
     * Creates a new Calendar instance
     * @param {Object} config - Calendar configuration
     * @param {Object} config.manageUser - User management instance for persisting data
     * @param {string} config.componentId - Unique identifier for event management
     * @param {string} config.messageContainer - ID of element for displaying messages
     */
    constructor({ manageUser, componentId, messageContainer }) {
        this.#manageUser = manageUser;
        this.#componentId = componentId;
        this.#messageContainer = messageContainer;
        this.#currentMonth = new Date().getMonth();
        this.#currentYear = new Date().getFullYear();
    }

    #updateMonthDisplay() {
        const monthName = this.#container.querySelector('#current-month');
        monthName.textContent = `${Calendar.#MONTHS[this.#currentMonth]} ${this.#currentYear}`;
    }

    #generateCalendarHTML() {
        const daysInMonth = new Date(this.#currentYear, this.#currentMonth + 1, 0).getDate();
        const firstDay = new Date(this.#currentYear, this.#currentMonth, 1).getDay();
        
        let html = '<table width="100%" border="1"><thead><tr>';
        // Add day headers
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            html += `<th>${day}</th>`;
        });
        html += '</tr></thead><tbody>';

        let date = 1;
        for (let i = 0; i < 6; i++) {
            if (date > daysInMonth) break;
            html += '<tr>';
            
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDay) {
                    html += '<td></td>';
                } else if (date > daysInMonth) {
                    html += '<td></td>';
                } else {
                    const fullDate = `${this.#currentYear}-${String(this.#currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                    const isSelected = this.#selectedDates.includes(fullDate);
                    html += `<td class="day${isSelected ? ' selected' : ''}" data-date="${fullDate}">${date}</td>`;
                    date++;
                }
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
        return html;
    }

    #navigateMonth(delta) {
        this.#currentMonth += delta;
        
        if (this.#currentMonth > 11) {
            this.#currentMonth = 0;
            this.#currentYear++;
        } else if (this.#currentMonth < 0) {
            this.#currentMonth = 11;
            this.#currentYear--;
        }

        this.#renderCalendar();
    }

    #toggleDate(cell) {
        const date = cell.dataset.date;
        const index = this.#selectedDates.indexOf(date);
        
        if (index > -1) {
            this.#selectedDates.splice(index, 1);
            cell.classList.remove('selected');
        } else {
            this.#selectedDates.push(date);
            cell.classList.add('selected');
        }
    }

    async #saveDates() {
        try {
            await this.#manageUser.updateLocalUserSettings({
                userData: this.#selectedDates,
                settingsProperty: 'blocked_dates'
            });

            safeDisplayMessage({
                elementId: this.#messageContainer,
                message: 'Dates saved successfully',
                isSuccess: true
            });
        } catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
            AppError.handleError(err);
        }
    }

    async #clearDates() {
        this.#selectedDates = [];
        await this.#saveDates();
        this.#renderCalendar();
    }

    #renderCalendar() {
        const grid = this.#container.querySelector('#calendar-grid');
        grid.innerHTML = this.#generateCalendarHTML();
        this.#updateMonthDisplay();
    }

    /**
     * Initializes the calendar with existing user data and builds the DOM structure
     * @async
     * @returns {Promise<HTMLElement>} The calendar container element
     * @throws {Error} If componentId is missing or initialization fails
     */
    async initialize() {
        try {
            if (!this.#componentId) {
                throw new Error('Component ID is required');
            }

            const settings = await this.#manageUser.getSettings('blocked_dates');
            if (settings?.blocked_dates) {
                this.#selectedDates = settings.blocked_dates;
            }

            // Build and render first
            this.#container = this.#buildCalendarStructure();
            this.#renderCalendar();
            
            // Return the container so it can be added to DOM
            return this.#container;
        } catch (err) {
            const { AppError } = await import('../../../core/errors/models/AppError.js');
            AppError.handleError(err);
        }
    }

    /**
     * Sets up event listeners for calendar interactions
     * Must be called after the calendar is added to the DOM
     * @async
     * @throws {Error} If componentId is missing or setup fails
     */
    async setupListeners() {
        if (!this.#componentId) {
            throw new Error('Component ID is required for event listeners');
        }

        // Add componentId to each listener
        [
            { id: 'prev-month', handler: () => this.#navigateMonth(-1) },
            { id: 'next-month', handler: () => this.#navigateMonth(1) },
            { id: 'calendar-grid', handler: (evt) => {
                if (evt.target.classList.contains('day')) {
                    this.#toggleDate(evt.target);
                }
            }},
            { id: 'save-dates', handler: () => this.#saveDates() },
            { id: 'clear-dates', handler: () => this.#clearDates() }
        ].forEach(({ id, handler }) => {
            addListener({
                elementOrId: id,
                eventType: 'click',
                handler,
                componentId: this.#componentId
            });
        });
    }

    /**
     * Builds the calendar DOM structure
     * @private
     * @returns {HTMLElement} The root calendar element
     */
    #buildCalendarStructure() {
        const structure = {
            type: 'div',
            attributes: { id: 'calendar-container' },
            children: {
                title: {
                    type: 'div',
                    myClass: ['w3-padding-small', 'w3-margin-top', 'w3-small'],
                    text: 'Select dates that you wish to be notified to not set bookings on.'
                },
                header: {
                    type: 'div',
                    myClass: ['w3-margin-bottom', 'w3-center', 'w3-margin-top'],
                    children: {
                        prevButton: {
                            type: 'button',
                            attributes: { id: 'prev-month', style: 'margin-right: 10px' },
                            text: '&lt;'
                        },
                        monthDisplay: {
                            type: 'span',
                            attributes: { id: 'current-month' }
                        },
                        nextButton: {
                            type: 'button',
                            attributes: { id: 'next-month', style: 'margin-left: 10px' },
                            text: '&gt;'
                        }
                    }
                },
                calendar: {
                    type: 'div',
                    attributes: { id: 'calendar-grid' },
                    myClass: ['w3-margin-bottom']
                },
                buttons: {
                    type: 'div',
                    myClass: ['w3-center'],
                    children: {
                        save: {
                            type: 'button',
                            myClass: ['w3-button', 'w3-black', 'w3-margin-right'],
                            attributes: { id: 'save-dates' },
                            text: 'Save Dates'
                        },
                        clear: {
                            type: 'button',
                            myClass: ['w3-button', 'w3-red', 'w3-margin-left'],
                            attributes: { id: 'clear-dates' },
                            text: 'Clear All Dates'
                        }
                    }
                }
            }
        };

        return buildElementTree(structure);
    }
}
