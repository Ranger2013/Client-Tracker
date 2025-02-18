export default function closeNavigationMenu(){
	const closeNav = document.querySelectorAll('.drop-menu');
	const sideBar = document.getElementById('mySidebar');

	// Ensure the side bar navigation closes with each new page
	if (sideBar.classList.contains('w3-show')) {
		sideBar.classList.remove('w3-show');
		sideBar.classList.add('w3-hide');
	}

	// Ensure main navigation menu's close with each new page
	closeNav.forEach(nav => {
		// Clost the navigation
		nav.nextElementSibling.classList.remove('w3-show');

		const img = nav.firstElementChild;

		if (img && img.classList.contains('up')) {
			img.src = "/public/siteImages/caret-down-white.svg";
		}
	});
}