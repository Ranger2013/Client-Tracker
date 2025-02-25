/**
 * Displays a user-friendly error page when navigation fails
 * @param {Object} params Error display parameters
 * @param {string} [params.requestedPage] The page that failed to load
 * @param {string} [params.errorType] Type of error that occurred
 * @returns {void}
 */
export function displayNavigationError({ requestedPage = '', errorType = 'load' } = {}) {
    const main = document.getElementById('main');
    const errorMessages = {
        load: 'The page you requested could not be loaded',
        notFound: 'The page you\'re looking for doesn\'t exist',
        build: 'There was a problem building the requested page'
    };

    main.innerHTML = `
        <div class="w3-container w3-center">
            <h4 class="w3-text-red">Navigation Error</h4>
            <p>${errorMessages[errorType]}</p>
            ${requestedPage ? `<p class="w3-text-grey">Page: ${requestedPage}</p>` : ''}
            <p class="w3-small">Please try again or contact support if the problem persists.</p>
        </div>`;
}
