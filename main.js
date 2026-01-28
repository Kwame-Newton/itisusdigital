// About Us 
document.addEventListener('DOMContentLoaded', () => {
  console.log('Itisus About page loaded');
  // Future: Add scroll animations or interactivity here
});


// Projects Filtering
const projectFilters = document.querySelectorAll('.filter-btn');
const projectItems = document.querySelectorAll('.project-card');

if (projectFilters.length && projectItems.length) {
  projectFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      projectFilters.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      projectItems.forEach(card => {
        const category = card.getAttribute('data-category');
        // If filter is 'all' or card matches the category, show it.
        // Note: Some cards might not have a category, adjust logic if needed.
        if (filter === 'all' || category === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}


