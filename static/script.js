// ============================================
// Dark Mode Toggle
// ============================================
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';

if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
} else {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
}

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
});

// ============================================
// Mobile Navigation
// ============================================
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.querySelector('i').classList.toggle('fa-bars');
    hamburger.querySelector('i').classList.toggle('fa-times');
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.querySelector('i').classList.add('fa-bars');
        hamburger.querySelector('i').classList.remove('fa-times');
    });
});

// ============================================
// Countdown to 2027-08-09
// ============================================
const targetDate = new Date('2027-08-09T00:00:00').getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
        document.getElementById('countdown').innerHTML = 'Election Day!';
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ============================================
// Active Navigation Link Highlighting
// ============================================
const sections = document.querySelectorAll('.section');
const navLinksAll = document.querySelectorAll('.nav-links a');

function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinksAll.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', updateActiveLink);
window.addEventListener('load', updateActiveLink);

// ============================================
// DYNAMIC: Load Blog Posts from API
// ============================================
async function loadBlogPosts() {
    try {
        const response = await fetch('/api/posts');
        if (!response.ok) throw new Error('Failed to fetch posts');
        const posts = await response.json();
        
        const blogContainer = document.getElementById('blog-posts');
        
        if (posts.length === 0) {
            blogContainer.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">No news yet. Check back soon!</p>';
            return;
        }

        // Build the blog grid
        let html = '<div class="blog-grid" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:2rem;">';
        posts.forEach(post => {
            html += `
                <div class="blog-card" style="background:var(--bg-secondary); padding:1.5rem; border-radius:12px; box-shadow:var(--shadow); border-top:4px solid var(--accent-red);">
                    <h3 style="color:var(--accent-green);">${post.title}</h3>
                    <p style="color:var(--text-secondary); font-size:0.85rem; margin:0.5rem 0;">
                        <i class="fas fa-calendar-alt"></i> ${new Date(post.created_at).toLocaleDateString('en-KE')}
                    </p>
                    <p style="color:var(--text-secondary);">${post.content.substring(0, 120)}...</p>
                </div>
            `;
        });
        html += '</div>';
        blogContainer.innerHTML = html;
    } catch (error) {
        console.error('Error loading blog posts:', error);
        document.getElementById('blog-posts').innerHTML = '<p style="text-align:center; color:var(--accent-red);">Could not load news. Please refresh.</p>';
    }
}

// Load posts when page loads
document.addEventListener('DOMContentLoaded', loadBlogPosts);

// ============================================
// DYNAMIC: Contact Form (Send to Backend API)
// ============================================
const contactForm = document.getElementById('contact-form');
const formFeedback = document.getElementById('form-feedback');
const submitBtn = document.getElementById('submit-btn');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
        formFeedback.innerHTML = '<span style="color:var(--accent-red);">Please fill in all fields.</span>';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    formFeedback.innerHTML = '';

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
        });

        const data = await response.json();

        if (response.ok) {
            formFeedback.innerHTML = '<span style="color:var(--accent-green);">✅ Message sent successfully! We will contact you soon.</span>';
            contactForm.reset();
        } else {
            formFeedback.innerHTML = `<span style="color:var(--accent-red);">❌ ${data.error || 'Something went wrong. Please try again.'}</span>`;
        }
    } catch (error) {
        formFeedback.innerHTML = '<span style="color:var(--accent-red);">❌ Network error. Please check your connection.</span>';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
    }
});
