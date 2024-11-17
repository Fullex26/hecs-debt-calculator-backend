function initializeFeedbackForm() {
  const feedbackButton = document.createElement('button');
  feedbackButton.className = 'feedback-button';
  feedbackButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
    <span>Feedback</span>
  `;

  const feedbackModal = document.createElement('div');
  feedbackModal.className = 'feedback-modal';
  feedbackModal.innerHTML = `
    <div class="feedback-modal-content">
      <button class="close-button" aria-label="Close feedback form">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
      </button>
      <h2>Send Feedback</h2>
      <form id="feedback-form">
        <div class="form-group">
          <label for="feedback-type">Type</label>
          <select id="feedback-type" name="type" required>
            <option value="">Select type...</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="general">General Comment</option>
          </select>
        </div>
        <div class="form-group">
          <label for="feedback-title">Title</label>
          <input type="text" id="feedback-title" name="title" required maxlength="200" placeholder="Brief summary">
        </div>
        <div class="form-group">
          <label for="feedback-description">Description</label>
          <textarea id="feedback-description" name="description" required maxlength="2000" rows="4" placeholder="Detailed description"></textarea>
        </div>
        <div class="form-group">
          <label for="feedback-email">Email (optional)</label>
          <input type="email" id="feedback-email" name="email" placeholder="For follow-up communications">
        </div>
        <button type="submit">Submit Feedback</button>
      </form>
    </div>
  `;

  document.body.appendChild(feedbackButton);
  document.body.appendChild(feedbackModal);

  // Show modal
  const showModal = () => {
    feedbackModal.classList.add('visible');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  };

  // Hide modal
  const hideModal = () => {
    feedbackModal.classList.remove('visible');
    document.body.style.overflow = ''; // Restore scrolling
  };

  // Event handlers
  feedbackButton.addEventListener('click', showModal);

  const closeButton = feedbackModal.querySelector('.close-button');
  closeButton.addEventListener('click', hideModal);

  // Close modal when clicking outside
  feedbackModal.addEventListener('click', (e) => {
    if (e.target === feedbackModal) {
      hideModal();
    }
  });

  // Handle escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && feedbackModal.classList.contains('visible')) {
      hideModal();
    }
  });

  const form = feedbackModal.querySelector('#feedback-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    
    const formData = {
      type: form.type.value,
      title: form.title.value,
      description: form.description.value,
      email: form.email.value
    };

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      alert('Thank you for your feedback!');
      form.reset();
      hideModal();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Feedback';
    }
  });
}

// Initialize feedback form when the page loads
document.addEventListener('DOMContentLoaded', initializeFeedbackForm); 