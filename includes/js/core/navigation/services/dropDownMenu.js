export default function dropDownMenu(evt) {
    evt.preventDefault();

    // Make sure we clicked on the dropdown trigger
    const trigger = evt.target.closest('.drop-menu');
    if (!trigger) return;

    // Get the dropdown content using data-target
    const contentId = trigger.dataset.target;
    if (!contentId) return;

    // Close any other open menus first
    const allDropdowns = document.querySelectorAll('.w3-dropdown-content');
    const allArrows = document.querySelectorAll('.arrow');
    
    allDropdowns.forEach(d => {
        if (d.id !== contentId) {
            d.classList.remove('w3-show');
        }
    });
    
    allArrows.forEach(a => {
        if (!a.closest(`[data-target="${contentId}"]`)) {
            a.classList.remove('up');
        }
    });

    const content = document.getElementById(contentId);
    const arrow = trigger.querySelector('.arrow');

    if (!content || !arrow) return;

    // Toggle the clicked dropdown and its arrow
    content.classList.toggle('w3-show');
    arrow.classList.toggle('up');
}