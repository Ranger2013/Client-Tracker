/**
 * Updates notice content while preserving close button
 * @param {HTMLElement} noticeDiv 
 * @param {string} message 
 * @param {boolean} isError 
 */
export function updateNotice(noticeDiv, message, isError = false) {
    // Clear existing content but preserve close button
    const closeButton = noticeDiv.querySelector('#backup-data-notice-close');
    noticeDiv.innerHTML = '';
    
    if (closeButton) {
        noticeDiv.appendChild(closeButton);
    }

    const messageEl = document.createElement('span');
    messageEl.textContent = message;
    if (isError) {
        messageEl.classList.add('w3-text-red');
    }
    
    noticeDiv.insertBefore(messageEl, closeButton);
    noticeDiv.classList.remove('w3-hide');
}

export function hideNotice(noticeDiv) {
    noticeDiv.classList.add('w3-hide');
}
