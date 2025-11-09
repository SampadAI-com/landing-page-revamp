// RSVP Form Handler
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('rsvpForm');

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        guests: formData.get('guests'),
      };

      try {
        const response = await fetch('/rsvp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          // Show success message
          showNotification(
            'Thank you! Your RSVP has been received!',
            'success'
          );
          form.reset();
        }
      } catch (error) {
        showNotification(
          'Oops! Something went wrong. Please try again.',
          'error'
        );
        console.error('Error:', error);
      }
    });
  }

  // Photo upload card click handler
  const uploadCard = document.querySelector('.upload-card');
  if (uploadCard) {
    uploadCard.addEventListener('click', () => {
      // In a real app, this would trigger a file upload
      showNotification('Photo upload feature coming soon!', 'info');
    });
  }

  // Smooth scroll for navigation
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
});

// Notification system
function showNotification(message, type = 'success') {
  // Remove existing notification if any
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Add styles
  Object.assign(notification.style, {
    position: 'fixed',
    top: '2rem',
    right: '2rem',
    background:
      type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#3b82f6',
    color: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    zIndex: '1000',
    animation: 'slideIn 0.3s ease',
    fontWeight: '500',
  });

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
document.head.appendChild(style);

// Add hover effects to grid items
document.addEventListener('DOMContentLoaded', () => {
  const gridItems = document.querySelectorAll('.grid-item');

  gridItems.forEach(item => {
    item.addEventListener('mouseenter', function () {
      this.style.transition = 'all 0.3s ease';
    });
  });
});
