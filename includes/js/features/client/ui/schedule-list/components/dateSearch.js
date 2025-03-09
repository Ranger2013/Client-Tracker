const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'september': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
};

// Single instance for the entire session
let userDateFormat = null;

/**
 * Matches search text against a date value considering user's date format preference
 * @param {string} searchText - The text to search for
 * @param {string} searchValue - The date value to search in (YYYY-MM-DD format)
 * @returns {Promise<boolean>} - Whether the date matches the search
 */
export async function matchesDateSearch({searchText, searchValue, manageUser}) {
    try {
        searchText = searchText.toLowerCase().trim();
        if (!searchText) return true;

        // Split value into date and weekday parts
        const [dateString, weekday] = searchValue.split(' ');

        // Handle weekday searches first
        if (DAYS.includes(searchText)) {
            return weekday === searchText;
        }

        // Create dates for comparison
        const targetDate = new Date(dateString);
        targetDate.setUTCHours(0, 0, 0, 0);

        // Handle month name searches
        for (const [monthName, monthNum] of Object.entries(MONTHS)) {
            if (searchText === monthName || monthName.startsWith(searchText)) {
                return targetDate.getUTCMonth() + 1 === monthNum;
            }
        }

        // Parse search text into a date for comparison
        const { date_format: dateFormat } = await manageUser.getDateTimeOptions();
        const searchDate = parseFlexibleDate(searchText, dateFormat);
        
        if (searchDate) {
            searchDate.setUTCHours(0, 0, 0, 0);
            return searchDate.getTime() === targetDate.getTime();
        }

        // Only do partial matches on month names or weekdays
        return DAYS.some(day => day.includes(searchText)) ||
               Object.keys(MONTHS).some(month => month.includes(searchText));

    } catch (err) {
        const { AppError } = await import("../../../../../core/errors/models/AppError.js");
        AppError.process(err, {
            errorCode: AppError.Types.INITIALIZATION_ERROR,
            userMessage: 'Search functionality not available at the moment.'
        }, true);
    }
}

function parseFlexibleDate(searchText, dateFormat) {
    // Remove any non-numeric characters except spaces
    const cleaned = searchText.replace(/[^\d\s]/g, '');
    
    // Define format patterns based on user preference
    const formatPatterns = {
        'Y-m-d': {
            pattern: /^(\d{4})[\s-]*(\d{1,2})[\s-]*(\d{1,2})$/,
            order: [0, 1, 2] // year, month, day
        },
        'm-d-Y': {
            pattern: /^(\d{1,2})[\s-]*(\d{1,2})[\s-]*(\d{4})$/,
            order: [2, 0, 1] // year, month, day
        },
        'd-m-Y': {
            pattern: /^(\d{1,2})[\s-]*(\d{1,2})[\s-]*(\d{4})$/,
            order: [2, 1, 0] // year, month, day
        }
    };

	 const format = formatPatterns[dateFormat] || formatPatterns['Y-m-d'];
    const match = cleaned.match(format.pattern);

    if (match) {
        const [_, ...parts] = match;
        const [yearPart, monthPart, dayPart] = format.order.map(i => parts[i]);
        return new Date(yearPart, monthPart - 1, dayPart);
    }

    // Handle partial dates (MM-DD or DD-MM depending on format)
    const partialMatch = cleaned.match(/^(\d{1,2})[\s-]*(\d{1,2})$/);
    if (partialMatch) {
        const [_, first, second] = partialMatch;
        const currentYear = new Date().getFullYear();
        
        // Use user's format preference to determine if first number is month or day
        const isMonthFirst = dateFormat === 'm-d-Y';
        const month = isMonthFirst ? first : second;
        const day = isMonthFirst ? second : first;
        
		  const newDate = new Date(currentYear, month - 1, day);
		  newDate.setHours(0, 0, 0, 0);
		  return newDate;
    }

    return null;
}

function compareDates(searchDate, targetDate) {
    if (!searchDate || !targetDate) return false;
    
    // Compare using ISO string to avoid timezone issues
    return searchDate.toISOString().split('T')[0] === 
           targetDate.toISOString().split('T')[0];
}

// Add this if you want to manually invalidate cache (probably not needed)
export function invalidateDateFormatCache() {
    userDateFormat = null;
}

