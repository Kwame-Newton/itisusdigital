
// Initialize Supabase if available
const isSupabaseReady = typeof supabase !== 'undefined';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded');
  if (!isSupabaseReady) {
    console.warn('Supabase client not loaded. Dynamic features may not work.');
  }

  // 1. Contact Form Handler (Contact.html)
  handleFormSubmission('contactForm', 'messages');

  // 2. Quote Request Form Handler (Services.html)
  handleFormSubmission('quoteRequestForm', 'quote_requests');

  // 3. Inquiry Form Handler (About Us.html)
  handleFormSubmission('inquiryForm', 'messages', 'General Inquiry: ');

  // 4. Fetch Projects (Projects.html)
  if (document.getElementById('projectsGrid')) {
    fetchProjects();
  }

  // 5. Setup Project Filtering
  setupProjectFiltering();
});

// Generic Form Handler
function handleFormSubmission(formId, tableName, subjectPrefix = '') {
  const form = document.getElementById(formId);
  if (!form) return;

  // Add status element if not present
  let statusEl = form.querySelector('.form-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.className = 'form-status';
    statusEl.style.marginTop = '10px';
    statusEl.style.fontWeight = 'bold';
    // Insert after submit button
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.parentNode.insertBefore(statusEl, btn.nextSibling);
    else form.appendChild(statusEl);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerText : 'Send';

    // Basic Validation
    const formData = new FormData(form);
    const data = {};

    // Map common fields to DB columns
    // Check for standard or 'q'-prefixed names

    // Name
    if (formData.has('name')) data.name = formData.get('name');
    else if (formData.has('qname')) data.name = formData.get('qname');

    // Email
    if (formData.has('email')) data.email = formData.get('email');
    else if (formData.has('qemail')) data.email = formData.get('qemail');

    // Message
    if (formData.has('message')) data.message = formData.get('message');
    else if (formData.has('qmessage')) data.message = formData.get('qmessage');

    // Phone (New for Quotes)
    if (formData.has('qphone')) data.phone = formData.get('qphone');

    // Service Type (New for Quotes)
    if (formData.has('qservice')) {
      // If the table is quote_requests, store in service_type column
      if (tableName === 'quote_requests') {
        data.service_type = formData.get('qservice');
      } else {
        // Fallback for generic messages table: append to subject
        if (subjectPrefix) subjectPrefix += `Service: ${formData.get('qservice')} `;
      }
    }

    // Subject handling
    let subject = subjectPrefix;
    if (formData.has('subject')) subject += formData.get('subject');

    // Only add subject if it's relevant (mostly for 'messages' table)
    if (tableName === 'messages') {
      data.subject = subject;
    }

    // Visual Feedback
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Sending...';
    }
    statusEl.innerText = '';
    statusEl.style.color = 'inherit';

    try {
      if (!isSupabaseReady) throw new Error('Supabase not configured.');

      const { error } = await supabase
        .from(tableName)
        .insert([data]);

      if (error) throw error;

      statusEl.innerText = 'Sent successfully!';
      statusEl.style.color = 'green';
      form.reset();
    } catch (error) {
      console.error('Submission error:', error);
      statusEl.innerText = 'Failed to send: ' + (error.message || error);
      statusEl.style.color = 'red';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
      }
    }
  });
}

// Fetch Projects Logic
async function fetchProjects() {
  const projectsContainer = document.getElementById('projectsGrid');
  if (!projectsContainer) return;

  // Show loading indicator
  projectsContainer.innerHTML = '<p>Loading projects...</p>';

  try {
    if (!isSupabaseReady) throw new Error('Supabase client missing');

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*');

    if (error) throw error;

    // Clear loading
    projectsContainer.innerHTML = '';

    if (!projects || projects.length === 0) {
      projectsContainer.innerHTML = '<p>No projects found.</p>';
      return;
    }

    projects.forEach(project => {
      const card = document.createElement('div');
      // Ensure category is lowercase for filtering
      const cat = (project.category || '').toLowerCase();
      card.className = `project-card ${cat}`;
      card.setAttribute('data-category', cat); // Standardize attribute

      // Image fallback
      const imgUrl = project.image_url || 'img/code2.jpg';

      card.innerHTML = `
                <img src="${imgUrl}" alt="${project.title}" loading="lazy">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
            `;
      projectsContainer.appendChild(card);
    });

    // Re-run filter logic if needed (it uses delegation currently so it's fine)
  } catch (err) {
    console.error('Error fetching projects:', err);
    projectsContainer.innerHTML = '<p>Could not load projects. Please try again later.</p>';
  }
}

// Filter Logic
function setupProjectFiltering() {
  const projectFilters = document.querySelectorAll('.filter-btn');
  if (!projectFilters.length) return;

  projectFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      // UI toggle
      projectFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      // Always re-query cards
      const cards = document.querySelectorAll('.project-card');
      cards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}
