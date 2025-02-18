import ManageUser from "../../../../classes/ManageUser.js";

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

async function getUserDateFormat() {
    if (!userDateFormat) {
        const manageUser = new ManageUser();
        const dateTimeOptions = await manageUser.getDateTimeOptions();
        userDateFormat = dateTimeOptions?.date_format || 'YYYY-MM-DD';
    }
    return userDateFormat;
}

// Add this if you want to manually invalidate cache (probably not needed)
export function invalidateDateFormatCache() {
    userDateFormat = null;
}

/**
 * Matches search text against a date value considering user's date format preference
 * @param {string} searchText - The text to search for
 * @param {string} dateValue - The date value to search in (YYYY-MM-DD format)
 * @returns {Promise<boolean>} - Whether the date matches the search
 */
export async function matchesDateSearch(searchText, dateValue) {
    try {
        // Remove async since the main logic is synchronous
        searchText = searchText.toLowerCase().trim();
        if (!searchText) return true;

        const [dateString, weekday] = dateValue.split(' ');
        const date = new Date(dateString);

        // Weekday and month searches are synchronous
        if (DAYS.includes(searchText)) {
            return weekday === searchText;
        }

        for (const [monthName, monthNum] of Object.entries(MONTHS)) {
            if (searchText === monthName || monthName.startsWith(searchText)) {
                return date.getMonth() + 1 === monthNum;
            }
        }

        // 3. Month Day format (e.g., "Mar 08" or "March 8")
        const monthDayMatch = searchText.match(/^([a-z]{3,})\s*(\d{1,2})$/i);
        if (monthDayMatch) {
            const [_, month, day] = monthDayMatch;
            const monthNum = MONTHS[month.toLowerCase()];
            if (monthNum) {
                return date.getMonth() + 1 === monthNum && date.getDate() === parseInt(day, 10);
            }
        }

        // 4. Parse date based on user's format preference
        const dateFormat = await getUserDateFormat();
        const searchDate = parseFlexibleDate(searchText, dateFormat);
        if (searchDate) {
            return compareDates(searchDate, date);
        }

        // 5. Partial matches (month names, days, etc)
        return dateValue.includes(searchText);
    } catch (err) {
        const { default: errorLogs } = await import("../../../../utils/error-messages/errorLogs.js");
        await errorLogs('dateSearchError', 'Date search failed:', err);
        return false;
    }
}

function parseFlexibleDate(searchText, dateFormat) {
    // Remove any non-numeric characters except spaces
    const cleaned = searchText.replace(/[^\d\s]/g, '');
    
    // Define format patterns based on user preference
    const formatPatterns = {
        'YYYY-MM-DD': {
            pattern: /^(\d{4})[\s-]*(\d{1,2})[\s-]*(\d{1,2})$/,
            order: [0, 1, 2] // year, month, day
        },
        'MM-DD-YYYY': {
            pattern: /^(\d{1,2})[\s-]*(\d{1,2})[\s-]*(\d{4})$/,
            order: [2, 0, 1] // year, month, day
        },
        'DD-MM-YYYY': {
            pattern: /^(\d{1,2})[\s-]*(\d{1,2})[\s-]*(\d{4})$/,
            order: [2, 1, 0] // year, month, day
        }
    };

    const format = formatPatterns[dateFormat] || formatPatterns['YYYY-MM-DD'];
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
        const isMonthFirst = dateFormat === 'MM-DD-YYYY';
        const month = isMonthFirst ? first : second;
        const day = isMonthFirst ? second : first;
        
        return new Date(currentYear, month - 1, day);
    }

    return null;
}

function compareDates(searchDate, targetDate) {
    // If only month/day provided, ignore year
    if (searchDate && targetDate) {
        return searchDate.getMonth() === targetDate.getMonth() && 
               searchDate.getDate() === targetDate.getDate();
    }
    return false;
}
