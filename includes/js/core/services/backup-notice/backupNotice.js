import { getValidElement } from '../../utils/dom/elements.min.js';
import { addListener, removeListeners } from '../../utils/dom/listeners.min.js';

/** 
 * Constants 
 */
const TWO_HOURS = 60 * 60 * 2 * 1000; // 2 Hours in milliseconds
// const TWO_HOURS = 60 * 1000; // 1 minute in milliseconds for testing.
const REMINDER_PATTERNS = ['add', 'edit', 'delete', 'dateTime', 'farrierPrices', 'schedulingOptions', 'mileageCharges', 'colorOptions'];
const BACKUP_NOTICE_ID = 'backup-notice-component';  // Add consistent component ID

// Backup data notice id passed to setupBackupNotice: 'backup-data-notice'
/**
 * Sets up the backup notice by updating it and adding an event listener to close it.
 */
export default async function setupBackupNotice({ errorEleID, manageUser }) {
    // noticeDiv is the 'backup-data-notice' element
    const noticeDiv = getValidElement(errorEleID);

    try {
        await initializeBackupNotice({ reminders: REMINDER_PATTERNS, displayElement: noticeDiv, manageUser });

        // Add event listener to close the notice
        addListener({
            elementOrId: `${errorEleID}-close`,
            eventType: 'click',
            handler: () => closeBackupNotice({noticeEle: noticeDiv, manageUser}),
            componentId: BACKUP_NOTICE_ID
        });
    }
    catch (error) {
        const { AppError } = await import("../../errors/models/AppError.min.js");
        AppError.handleError(error, {
            originalError: error,
            errorCode: AppError.Types.BACKUP_ERROR,
            userMessage: 'Error: Reminder system failed.',
            displayTarget: noticeDiv,
        });
    }
}

/**
 * Populates the backup notice based on user settings and data in IndexedDB.
 */
async function initializeBackupNotice({ reminders, displayElement, manageUser }) {
    try {
        const userSettings = await manageUser.getSettings();
        const idbStores = await manageUser.getStoreNames();

        // Check if we should show the reminder yet.
        if (shouldShowReminder(userSettings)) {
            const stores = filterStores(idbStores, reminders);
            const hasDataToBackup = await manageUser.checkStoresForData(stores);

            if (hasDataToBackup) {
                updateNoticeContent(displayElement, 'You currently have data that needs to be backed up to the server.');
            } else {
                hideBackupNotice(displayElement);
            }
        }
    }
    catch (err) {
        const { AppError } = await import("../../errors/models/AppError.min.js");
        throw new AppError('Failed to initialize backup notice: ', {
            originalError: err,
            errorCode: AppError.Types.BACKUP_ERROR,
            userMessage: 'Unable to check for pending backups',
            displayTarget: displayElement,
        });
    }
}

/**
 * Determines if the reminder should be shown based on user settings.
 * @param {Object} userSettings - The user settings from IndexedDB.
 * @returns {boolean} - True if the reminder should be shown, false otherwise.
 */
function shouldShowReminder(userSettings) {
    const reminderStatus = userSettings.reminders.status;
    const reminderTimestamp = userSettings.reminders.timestamp;

    const now = new Date().getTime();

    return (reminderStatus === 'default' || reminderStatus === 'yes') &&
        (reminderTimestamp === 0 || now - reminderTimestamp >= TWO_HOURS);
}

/**
 * Updates notice content while preserving structure
 * @param {HTMLElement} noticeDiv - The notice element
 * @param {string} message - Message to display
 * @param {boolean} [isError=false] - Whether this is an error message
 */
function updateNoticeContent(noticeDiv, message, isError = false) {
    // Clear existing message but preserve close button
    const closeButton = noticeDiv.querySelector('#backup-data-notice-close');
    noticeDiv.innerHTML = '';
    if (closeButton) noticeDiv.appendChild(closeButton);

    const messageEl = document.createElement('span');
    messageEl.textContent = message;
    
    if (isError) messageEl.classList.add('w3-text-red');
    noticeDiv.insertBefore(messageEl, closeButton);
    noticeDiv.classList.remove('w3-hide');
}

/**
 * Filters the stores based on the given patterns.
 * @param {Object} stores - The stores from IndexedDB.
 * @param {Array<string>} patterns - The patterns to filter the stores.
 * @returns {Object} - The filtered stores.
 */
function filterStores(stores, patterns) {
    return Object.keys(stores)
        .filter(key => patterns.some(pattern => key.toLowerCase().includes(pattern.toLowerCase())))
        .reduce((acc, key) => {
            acc[key] = stores[key];
            return acc;
        }, {});
}

/**
 * Hides the backup notice.
 * @param {HTMLElement} noticeDiv - The notice div element.
 */
function hideBackupNotice(noticeDiv) {
    noticeDiv.classList.add('w3-hide');
}

/**
 * Closes the backup notice and updates the user settings in IndexedDB.
 */
async function closeBackupNotice({noticeEle, manageUser}) {
    try {
        const userSettings = await manageUser.getSettings();
        const { status, timestamp } = userSettings.reminders;

        const newSettings = {
           status,
           timestamp: Date.now(),
        };

        await manageUser.updateLocalUserSettings({
            userData: newSettings,
            settingsProperty: 'reminders',
        });

        hideBackupNotice(noticeEle);
        removeListeners(BACKUP_NOTICE_ID);
    }
    catch (err) {
        const { AppError } = await import("../../errors/models/AppError.min.js");
        AppError.handleError(err, {
            errorCode: AppError.Types.DATABASE_ERROR,
            userMessage: AppError.BaseMessages.system.server,
            displayTarget: noticeEle,
        });
    }
}