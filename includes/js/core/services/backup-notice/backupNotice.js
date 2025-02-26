import { addListener } from '../../utils/dom/listeners.js';

/** 
 * Constants 
 */
const TWO_HOURS = 60 * 60 * 2 * 1000; // 2 Hours in milliseconds
const REMINDER_PATTERNS = ['add', 'edit', 'delete', 'dateTime', 'farrierPrices', 'schedulingOptions', 'mileageCharges', 'colorOptions'];
const BACKUP_NOTICE_ID = 'backup-notice-component';  // Add consistent component ID

/**
 * Sets up the backup notice by updating it and adding an event listener to close it.
 */
export default async function setupBackupNotice({ errorEleID }) {
    try {
        const noticeDiv = document.getElementById(errorEleID);
        if (!noticeDiv) {
            throw new Error('Backup notice element not found.');
        }

        await updateBackupNotice();
        addListener(`${errorEleID}-close`, 'click', closeBackupNotice, BACKUP_NOTICE_ID);
    }
    catch (err) {
        const { errorLogs } = await import("../../errors/services/errorLogs.js");
        await errorLogs('backupNotice', 'Failed to setup backup notice', err);
        updateNoticeContent(noticeDiv, 'Unable to check backup status', true);
    }
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
 * Updates the backup notice based on user settings and data in IndexedDB.
 */
async function updateBackupNotice() {
    const noticeDiv = document.getElementById('backup-data-notice');

    try {
        const { default: IndexedDBOperations } = await import("../../database/IndexedDBOperations.js");
        const indexed = new IndexedDBOperations();

        const db = await indexed.openDBPromise();
        const userSettings = await indexed.getAllStorePromise(db, indexed.stores.USERSETTINGS);

        if (shouldShowReminder(userSettings)) {
            const stores = filterStores(indexed.stores, REMINDER_PATTERNS);
            const hasDataToBackup = await checkStoresForData(db, stores, indexed);

            if (hasDataToBackup) {
                updateNoticeContent(noticeDiv, 'You currently have data that needs to be backed up to the server.');
            } else {
                hideBackupNotice(noticeDiv);
            }
        }
    }
    catch (err) {
        const { errorLogs } = await import("../../errors/services/errorLogs.js");
        await errorLogs('backupNotice', 'Failed to check backup status', err);
        updateNoticeContent(noticeDiv, 'Unable to check for pending backups', true);
    }
}

/**
 * Clears any previous message from the notice div.
 * @param {HTMLElement} noticeDiv - The notice div element.
 */
function clearPreviousMessage(noticeDiv) {
    if (noticeDiv.lastChild && noticeDiv.lastChild.nodeType === Node.TEXT_NODE) {
        noticeDiv.removeChild(noticeDiv.lastChild);
    }
}

/**
 * Determines if the reminder should be shown based on user settings.
 * @param {Object} userSettings - The user settings from IndexedDB.
 * @returns {boolean} - True if the reminder should be shown, false otherwise.
 */
function shouldShowReminder(userSettings) {
    if (userSettings && Object.keys(userSettings).length > 0) {
        const backupReminder = userSettings[0].reminders.status;
        const timeSinceLastReminderClose = userSettings[0].reminders.timestamp;
        const now = new Date().getTime();

        return (backupReminder === 'default' || backupReminder === 'yes') &&
            (timeSinceLastReminderClose === 0 || now - timeSinceLastReminderClose >= TWO_HOURS);
    }
    return false;
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
 * Checks if there is any data to backup in the given stores.
 * @param {IDBDatabase} db - The IndexedDB database.
 * @param {Object} stores - The filtered stores.
 * @param {IndexedDBOperations} indexed - The IndexedDB operations instance.
 * @returns {Promise<boolean>} - True if there is data to backup, false otherwise.
 */
async function checkStoresForData(db, stores, indexed) {
    for (let store in stores) {
        const objectStore = await indexed.getAllStorePromise(db, stores[store]);
        if (objectStore && objectStore.length > 0) {
            return true;
        }
    }
    return false;
}

/**
 * Shows the backup notice.
 * @param {HTMLElement} noticeDiv - The notice div element.
 */
function showBackupNotice(noticeDiv) {
    const newText = document.createTextNode('You currently have data that needs to be backed up to the server.');
    noticeDiv.append(newText);
    noticeDiv.classList.remove('w3-hide');
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
async function closeBackupNotice() {
    const noticeDiv = document.getElementById('backup-data-notice');

    try {
        const { default: IndexedDBOperations } = await import("../../database/IndexedDBOperations.js");
        const { removeListeners } = await import("../../utils/dom/listeners.js");
        const indexed = new IndexedDBOperations();

        const db = await indexed.openDBPromise();
        const userSettings = await indexed.getAllStorePromise(db, indexed.stores.USERSETTINGS);

        if (!userSettings?.[0]) {
            throw new Error('No user settings found');
        }

        userSettings[0].reminders.timestamp = Date.now();
        await indexed.clearStorePromise(db, indexed.stores.USERSETTINGS);
        await indexed.putStorePromise(db, userSettings[0], indexed.stores.USERSETTINGS);

        hideBackupNotice(noticeDiv);
        removeListeners(BACKUP_NOTICE_ID);
    }
    catch (err) {
        await errorLogs('backupNotice', 'Failed to close backup notice', err);
        updateNoticeContent(noticeDiv, 'Unable to update notification settings', true);
    }
}