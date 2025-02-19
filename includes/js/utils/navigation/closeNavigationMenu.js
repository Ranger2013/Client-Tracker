/**
 * Closes all navigation menus and resets their states
 * Used during page transitions to ensure clean navigation state
 * 
 * @returns {void}
 */
export default function closeNavigationMenu() {
    const closeNav = document.querySelectorAll('.drop-menu');
    const sideBar = document.getElementById('mySidebar');

    // Close sidebar if open
    if (sideBar?.classList.contains('w3-show')) {
        sideBar.classList.remove('w3-show');
        sideBar.classList.add('w3-hide');
    }

    // Close all dropdown menus and reset their icons
    closeNav?.forEach(nav => {
        // Close the navigation
        nav.nextElementSibling?.classList.remove('w3-show');

        const img = nav.firstElementChild;
        if (img?.classList.contains('up')) {
            img.classList.remove('up');
        }
    });
}