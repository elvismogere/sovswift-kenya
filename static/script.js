// ============================================
// Dark/Light Mode Toggle (Navbar)
// ============================================
const toggleBtn = document.getElementById('nav-mode-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';

if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggleBtn.innerHTML = '<i class="fas fa-sun"></i> Mode';
} else {
    toggleBtn.innerHTML = '<i class="fas fa-moon"></i> Mode';
}

toggleBtn.addEventListener('click', function(e) {
    e.preventDefault();
    const theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        toggleBtn.innerHTML = '<i class="fas fa-moon"></i> Mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        toggleBtn.innerHTML = '<i class="fas fa-sun"></i> Mode';
    }
});

// ============================================
// Mobile Nav
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
// SMOOTH SCROLL with navbar offset (FIXED)
// ============================================
function smoothScrollTo(targetId) {
    const targetElement = document.querySelector(targetId);
    if (!targetElement) return;

    // Calculate navbar height dynamically
    const navbar = document.querySelector('.navbar');
    const navbarHeight = navbar ? navbar.offsetHeight : 80;

    // Get the target's position relative to the document
    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;

    // Scroll to target minus navbar height + a small extra padding for comfort
    const offsetPosition = targetPosition - navbarHeight - 10;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });

    // Update active nav link
    document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-links a[href="${targetId}"]`);
    if (activeLink) activeLink.classList.add('active');
}

// Handle all nav links
document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        smoothScrollTo(targetId);
    });
});

// Handle all other anchor links (buttons like "Our Policy", "Join the Movement")
document.querySelectorAll('a[href^="#"]').forEach(link => {
    // Skip nav links already handled above
    if (link.closest('.nav-links')) return;

    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        smoothScrollTo(targetId);
    });
});

// ============================================
// Countdown Timer
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
// Intersection Observer for Fade-In
// ============================================
const fadeElements = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 100);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

fadeElements.forEach(el => observer.observe(el));

// ============================================
// Active nav link on scroll (with offset)
// ============================================
const sections = document.querySelectorAll('.section');
const navLinksAll = document.querySelectorAll('.nav-links a');

function updateActiveLink() {
    const navbar = document.querySelector('.navbar');
    const navbarHeight = navbar ? navbar.offsetHeight : 80;
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - navbarHeight - 20;
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
// Load blog posts (if any)
// ============================================
async function loadBlogPosts() {
    try {
        const response = await fetch('/api/posts');
        if (!response.ok) throw new Error('Failed to fetch posts');
        const posts = await response.json();
        const blogContainer = document.getElementById('blog-posts');
        if (!blogContainer) return;
        if (posts.length === 0) {
            blogContainer.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">No news yet. Check back soon!</p>';
            return;
        }
        let html = '<div class="blog-grid">';
        posts.forEach(post => {
            html += `
                <div class="blog-card">
                    <h3>${post.title}</h3>
                    <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">
                        <i class="fas fa-calendar-alt"></i> ${new Date(post.created_at).toLocaleDateString('en-KE')}
                    </p>
                    <p>${post.content.substring(0, 120)}...</p>
                </div>
            `;
        });
        html += '</div>';
        blogContainer.innerHTML = html;
    } catch (error) {
        console.error('Error loading blog posts:', error);
        const blogContainer = document.getElementById('blog-posts');
        if (blogContainer) {
            blogContainer.innerHTML = '<p style="text-align:center; color:var(--accent-red);">Could not load news. Please refresh.</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', loadBlogPosts);

// ============================================
// Contact Form
// ============================================
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    const formFeedback = document.getElementById('form-feedback');
    const submitBtn = document.getElementById('submit-btn');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!name || !email || !message) {
            formFeedback.innerHTML = '<span style="color:var(--accent-red);">All fields required.</span>';
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
                formFeedback.innerHTML = '<span style="color:var(--accent-green);">✅ Message sent! We\'ll contact you soon.</span>';
                contactForm.reset();
            } else {
                formFeedback.innerHTML = `<span style="color:var(--accent-red);">❌ ${data.error || 'Error. Try again.'}</span>`;
            }
        } catch (error) {
            formFeedback.innerHTML = '<span style="color:var(--accent-red);">❌ Network error. Check your connection.</span>';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
    });
}
