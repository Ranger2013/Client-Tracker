/**
 * Sorts objects based on the combined trim_date and app_time properties.
 * 
 * @param {Object} a - The first object to compare.
 * @param {Object} a.trim_date - The trim date of the first object.
 * @param {Object} a.app_time - The appointment time of the first object.
 * @param {Object} b - The second object to compare.
 * @param {Object} b.trim_date - The trim date of the second object.
 * @param {Object} b.app_time - The appointment time of the second object.
 * @param {boolean} [ascending=true] - Determines whether to sort in ascending order.
 * @returns {number} -1 if the first date is earlier, 1 if later, or 0 if equal.
 */
export const sortByTrimDateAndAppTime = (a, b, ascending = true) => {
	const dateA = new Date(`${a.trim_date} ${a.app_time}`);
	const dateB = new Date(`${b.trim_date} ${b.app_time}`);
	return ascending ? dateA - dateB : dateB - dateA;
}

/**
* Sorts date strings.
* 
* @param {string} a - The first date string to compare.
* @param {string} b - The second date string to compare.
* @param {boolean} [ascending=true] - Determines whether to sort in ascending order.
* @returns {number} -1 if the first date is earlier, 1 if later, or 0 if equal.
*/
export const sortByDateOnly = (a, b, ascending = true) => {
	let dateA = new Date(a);
	let dateB = new Date(b);

	if (ascending) {
		if (dateA < dateB) return -1;
		if (dateA > dateB) return 1;
	} else {
		if (dateA > dateB) return -1;
		if (dateA < dateB) return 1;
	}
	return 0;
}

/**
 * Formats a given date string according to the specified format.
 * @param {string} date - The date string in the format 'YYYY-MM-DD'.
 * @param {string} format - The desired date format ('Y-m-d', 'm-d-Y', 'd-m-Y').
 * @param {boolean} [namedDay=false] - Whether to include the name of the day.
 * @returns {string} The formatted date string.
 */
export function formatDate(date, format, namedDay = false) {
	const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	const today = new Date(date + 'T00:00:00');

	if (isNaN(today.getTime())) {
		throw new Error('Invalid date');
	}

	const day = String(today.getDate()).padStart(2, '0');
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const year = today.getFullYear();
	const nameDay = days[today.getDay()];

	const formattedDate = (format) => {
		switch (format) {
			case 'Y-m-d':
				return `${year}-${month}-${day}`;
			case 'm-d-Y':
				return `${month}-${day}-${year}`;
			case 'd-m-Y':
				return `${day}-${month}-${year}`;
			default:
				return `${year}-${month}-${day}`;
		}
	};

	return namedDay ? `${nameDay}<br>${formattedDate(format)}` : formattedDate(format);
}

export const getSMSWeekday = (userDate) => {
	let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	let [year, month, day] = userDate.split('-').map(Number);
	let date = new Date(year, month - 1, day);
	let nameDate = days[date.getDay()];

	return nameDate;
}

/**
* Formats a given time string according to the specified time format (12-hour or 24-hour).
* 
* @param {string} t - The time string to format.
* @param {number} f - The time format (12 or 24). If 12, formats time to 12-hour with AM/PM.
* @returns {string} The formatted time string.
*/
export function formatTime(t, f) {
	let pattern = /([01]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?/;
	let time = t.trim().match(pattern);

	if (f == 12) {
		if (time[1] == 12) {
			var c = time[1] + ':' + time[2] + ' pm';
		}
		else if (time[1] > 12) {
			var ch = time[1] - 12;
			var c = ch + ':' + time[2] + ' pm';
		}
		else {
			var c = time[1] + ':' + time[2] + ' am';
			c = c.replace(/^0+/, '');
		}
		return c;
	}
	return time[1] + ':' + time[2];
}

/**
 * Gets the current date or a future date in the format YYYY-MM-DD.
 * If a number of days is provided, it returns the date that many days in the future.
 * 
 * @param {number|null} [days=null] - The number of days to add to the current date. If null, the current date is used.
 * @returns {string} The formatted date in YYYY-MM-DD.
 */
export function getReadableCurrentFutureDate(days = null) {
	const now = new Date();
	now.setHours(0, 0, 0, 0); // Sets the time to midnight

	let futureDate;

	if (days) {
		futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
	} else {
		futureDate = now;
	}

	return futureDate.toISOString().split('T')[0];
}

/**
* Gets the current time in the format HH:MM (24-hour format).
* Pads the hours and minutes with a leading zero if they are less than 10.
* 
* @returns {string} The formatted current time in HH:MM.
*/
export function getCurrentTime() {
	const now = new Date();
	let currentHours = now.getHours();
	let currentMinutes = now.getMinutes();

	currentHours = currentHours < 10 ? '0' + currentHours : currentHours;
	currentMinutes = currentMinutes < 10 ? '0' + currentMinutes : currentMinutes;

	return currentHours + ':' + currentMinutes;
}
