/**
 * DateHelper class for handling date operations with consistent behavior
 */
export default class DateHelper {
	#date;

	/**
	 * Create a new DateHelper instance
	 * @param {Date|string|number} input - Date object, ISO date string, or timestamp
	 */
	constructor(input) {
		if (input instanceof DateHelper) {
			this.#date = new Date(input.#date);
		} else if (input instanceof Date) {
			this.#date = new Date(input);
		} else if (typeof input === 'string' && input.includes('-')) {
			// Handle ISO format dates like "2025-04-05" properly
			const [year, month, day] = input.split('-').map(Number);
			this.#date = new Date(year, month - 1, day);
		} else if (input) {
			this.#date = new Date(input);
		} else {
			this.#date = new Date();
		}
	}

	/**
	 * Get the date normalized to midnight (no time component)
	 * @returns {Date} Date object set to midnight
	 */
	getNormalizedDate() {
		return new Date(
			this.#date.getFullYear(),
			this.#date.getMonth(),
			this.#date.getDate()
		);
	}

	/**
	 * Compare if this date is equal to another date (ignoring time)
	 * @param {Date|string|DateHelper} otherDate - Date to compare with
	 * @returns {boolean} True if dates are the same day
	 */
	equals(otherDate) {
		const other = otherDate instanceof DateHelper ? otherDate : new DateHelper(otherDate);
		const thisNormalized = this.getNormalizedDate().getTime();
		const otherNormalized = other.getNormalizedDate().getTime();
		return thisNormalized === otherNormalized;
	}

	/**
	 * Compare if this date is before another date (ignoring time)
	 * @param {Date|string|DateHelper} otherDate - Date to compare with
	 * @returns {boolean} True if this date is before the other date
	 */
	isBefore(otherDate) {
		const other = otherDate instanceof DateHelper ? otherDate : new DateHelper(otherDate);
		const thisNormalized = this.getNormalizedDate().getTime();
		const otherNormalized = other.getNormalizedDate().getTime();
		return thisNormalized < otherNormalized;
	}

	/**
	 * Compare if this date is same or before another date (ignoring time)
	 * @param {Date|string|DateHelper} otherDate - Date to compare with
	 * @returns {boolean} True if this date is same or after the other date
	 */
	isSameOrBefore(otherDate) {
		const other = otherDate instanceof DateHelper ? otherDate : new DateHelper(otherDate);
		const thisNormalized = this.getNormalizedDate().getTime();
		const otherNormalized = other.getNormalizedDate().getTime();
		return thisNormalized <= otherNormalized;
	}

	/**
	 * Compare if this date is after another date (ignoring time)
	 * @param {Date|string|DateHelper} otherDate - Date to compare with
	 * @returns {boolean} True if this date is after the other date
	 */
	isAfter(otherDate) {
		const other = otherDate instanceof DateHelper ? otherDate : new DateHelper(otherDate);
		const thisNormalized = this.getNormalizedDate().getTime();
		const otherNormalized = other.getNormalizedDate().getTime();
		return thisNormalized > otherNormalized;
	}

	/**
	 * Compare if this date is same or after another date (ignoring time)
	 * @param {Date|string|DateHelper} otherDate - Date to compare with
	 * @returns {boolean} True if this date is same or after the other date
	 */
	isSameOrAfter(otherDate) {
		const other = otherDate instanceof DateHelper ? otherDate : new DateHelper(otherDate);
		const thisNormalized = this.getNormalizedDate().getTime();
		const otherNormalized = other.getNormalizedDate().getTime();
		return thisNormalized >= otherNormalized;
	}

	/**
	 * Format date as YYYY-MM-DD
	 * @returns {string} Formatted date string
	 */
	toYYYYMMDD() {
		const year = this.#date.getFullYear();
		const month = String(this.#date.getMonth() + 1).padStart(2, '0');
		const day = String(this.#date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	/**
	 * Add days to this date
	 * @param {number} days - Number of days to add
	 * @returns {DateHelper} New DateHelper instance
	 */
	addDays(days) {
		const newDate = new Date(this.#date);
		newDate.setDate(newDate.getDate() + days);
		return new DateHelper(newDate);
	}

	/**
	 * Add months to this date
	 * @param {number} months - Number of months to add
	 * @returns {DateHelper} New DateHelper instance
	 */
	addMonths(months) {
		const newDate = new Date(this.#date);
		newDate.setMonth(newDate.getMonth() + months);
		return new DateHelper(newDate);
	}

	/**
	 * Get native Date object
	 * @returns {Date} Native Date object
	 */
	toNativeDate() {
		return new Date(this.#date);
	}

	/**
 * Creates a DateHelper instance from a date string
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {DateHelper} New DateHelper instance
 */
	fromString(dateString) {
		return new DateHelper(dateString);
	}

	/**
	 * Create DateHelper for today
	 * @returns {DateHelper} DateHelper instance for today
	 */
	today() {
		return new DateHelper(new Date());
	}

	static today() {
		return new DateHelper(new Date());
	}

	/**
	 * Convert to string for display
	 * @returns {string} String representation of date
	 */
	toString() {
		return this.#date.toString();
	}
}