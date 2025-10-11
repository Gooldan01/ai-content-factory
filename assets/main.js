document.getElementById('y').textContent = new Date().getFullYear();

// Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
const menuOverlay = document.getElementById('menuOverlay');
const body = document.body;

function toggleMenu() {
  menuToggle.classList.toggle('is-active');
  mainNav.classList.toggle('is-active');
  menuOverlay.classList.toggle('is-active');
  body.classList.toggle('menu-open');
}

function closeMenu() {
  menuToggle.classList.remove('is-active');
  mainNav.classList.remove('is-active');
  menuOverlay.classList.remove('is-active');
  body.classList.remove('menu-open');
}

// Toggle menu on button click
menuToggle.addEventListener('click', toggleMenu);

// Close menu when clicking on overlay
menuOverlay.addEventListener('click', closeMenu);

// Close menu when clicking on links
const navLinks = mainNav.querySelectorAll('a');
navLinks.forEach(link => {
  link.addEventListener('click', closeMenu);
});


// Phone widget click handler
document.addEventListener('DOMContentLoaded', function() {
  const phoneBtn = document.querySelector('.phone-btn');
  const phoneNumber = document.querySelector('.phone-number');

  function makeCall() {
    window.location.href = 'tel:+79154079757';
  }

  if (phoneBtn) {
    phoneBtn.addEventListener('click', makeCall);
    // Also handle clicks on SVG inside the button
    const phoneSvg = phoneBtn.querySelector('svg');
    if (phoneSvg) {
      phoneSvg.addEventListener('click', makeCall);
    }
  }

  if (phoneNumber) {
    phoneNumber.addEventListener('click', function(e) {
      e.preventDefault();
      makeCall();
    });
  }
});

// Hero section viewport optimization
function optimizeHeroHeight() {
  const heroSection = document.querySelector('#hero');
  const heroCenter = document.querySelector('.hero-center');

  if (heroSection && heroCenter) {
    const headerHeight = 80;
    const viewportHeight = window.innerHeight;
    const availableHeight = viewportHeight - headerHeight;

    // Calculate content height
    const contentHeight = heroCenter.scrollHeight;

    // Set hero section to fill viewport
    heroSection.style.minHeight = availableHeight + 'px';

    // Center content vertically within the hero section
    heroCenter.style.minHeight = 'auto';
    heroCenter.style.paddingTop = '60px';
    heroCenter.style.paddingBottom = '60px';

    // If content is too tall for viewport, adjust padding
    if (contentHeight + 120 > availableHeight) {
      heroCenter.style.paddingTop = '20px';
      heroCenter.style.paddingBottom = '20px';
    }
  }
}

// Run on load and resize
window.addEventListener('load', optimizeHeroHeight);
window.addEventListener('resize', optimizeHeroHeight);

(function () {
  const tabs = document.querySelectorAll('.tabs .tab');
  const panes = document.querySelectorAll('.tab-panes .pane');
  if (!tabs.length) return;
  function activate(tab) {
    tabs.forEach(t => t.classList.toggle('is-active', t === tab));
    panes.forEach(p => p.classList.toggle('is-active', p.id === tab.dataset.tab));
  }
  const initial = document.querySelector('.tabs .tab.is-active') || tabs[0];
  requestAnimationFrame(() => activate(initial));
  tabs.forEach(tab => tab.addEventListener('click', () => activate(tab)));
})();

// Back to top button - enhanced version
document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('toTop');
  if (!btn) return;

  // Show/hide button based on scroll
  function updateButton() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollTop > 300) {
      btn.classList.add('is-visible');
    } else {
      btn.classList.remove('is-visible');
    }
  }

  // Listen for scroll events
  window.addEventListener('scroll', updateButton, { passive: true });

  // Initial check
  updateButton();

  // Click handler
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
});

// Scroll highlight effect for Why section subtitle
window.addEventListener('scroll', function() {
  const whySection = document.getElementById('why');

  if (whySection) {
    const subtitle = whySection.querySelector('.sub');

    if (subtitle) {
      const rect = whySection.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Check if section is in viewport (when it enters the screen)
      if (rect.top < windowHeight * 0.3 && rect.bottom > windowHeight * 0.7) {
        subtitle.classList.add('highlighted');
      } else {
        subtitle.classList.remove('highlighted');
      }
    }
  }
}, { passive: true });

// Also trigger on page load in case section is already visible
window.addEventListener('load', function() {
  const whySection = document.getElementById('why');

  if (whySection) {
    const subtitle = whySection.querySelector('.sub');

    if (subtitle) {
      const rect = whySection.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top < windowHeight * 0.3 && rect.bottom > windowHeight * 0.7) {
        subtitle.classList.add('highlighted');
      }
    }
  }
});

// Hero parallax effect (Saatchi-style)
let ticking = false;
window.addEventListener('scroll', function() {
  if (!ticking) {
    window.requestAnimationFrame(function() {
      const heroSection = document.getElementById('hero');
      const heroTitle = document.querySelector('.hero-title');
      const heroHook = document.querySelector('.hero-hook');
      const heroButton = document.querySelector('.hero-cta-wrapper');

      if (heroSection && heroTitle) {
        const scrolled = window.pageYOffset;
        const heroHeight = heroSection.offsetHeight;

        // Only apply parallax while hero is visible
        if (scrolled < heroHeight) {
          const parallaxSpeed1 = scrolled * 0.5;
          const parallaxSpeed2 = scrolled * 0.3;
          const parallaxSpeed3 = scrolled * 0.2;

          heroTitle.style.transform = `translateY(${parallaxSpeed1}px)`;
          if (heroHook) {
            heroHook.style.transform = `translateY(${parallaxSpeed2}px)`;
          }
          if (heroButton) {
            heroButton.style.transform = `translateY(${parallaxSpeed3}px)`;
          }

          // Fade out effect
          const opacity = 1 - (scrolled / heroHeight) * 1.5;
          heroTitle.style.opacity = Math.max(0, opacity);
          if (heroHook) {
            heroHook.style.opacity = Math.max(0, opacity);
          }
          if (heroButton) {
            heroButton.style.opacity = Math.max(0, opacity);
          }
        }
      }

      ticking = false;
    });

    ticking = true;
  }
}, { passive: true });

// Services Gallery Widget
(function() {
  const gallery = document.querySelector('.services-gallery');
  if (!gallery) return;

  const slides = gallery.querySelectorAll('.gallery-slide');
  const indicators = gallery.querySelectorAll('.indicator');
  const prevBtn = gallery.querySelector('.gallery-prev');
  const nextBtn = gallery.querySelector('.gallery-next');
  const progressBar = gallery.querySelector('.progress-bar');

  let currentSlide = 0;
  let autoPlayInterval = null;
  let progressInterval = null;
  const autoPlayDelay = 12000; // 12 seconds
  const progressUpdateInterval = 50; // Update progress every 50ms

  function showSlide(index) {
    // Remove active class from all slides and indicators
    slides.forEach(slide => {
      slide.classList.remove('active', 'prev');
    });
    indicators.forEach(ind => ind.classList.remove('active'));

    // Set prev class for slide transition
    if (currentSlide !== index) {
      slides[currentSlide].classList.add('prev');
    }

    // Add active class to current slide and indicator
    currentSlide = index;
    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');

    // Reset progress bar
    resetProgressBar();
  }

  function nextSlide() {
    const next = (currentSlide + 1) % slides.length;
    showSlide(next);
  }

  function prevSlide() {
    const prev = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(prev);
  }

  function resetProgressBar() {
    if (progressBar) {
      progressBar.style.width = '0%';
    }

    // Clear existing progress interval
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    // Start new progress animation
    let progress = 0;
    const increment = (100 / autoPlayDelay) * progressUpdateInterval;

    progressInterval = setInterval(() => {
      progress += increment;
      if (progressBar) {
        progressBar.style.width = Math.min(progress, 100) + '%';
      }
      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, progressUpdateInterval);
  }

  function startAutoPlay() {
    stopAutoPlay(); // Clear any existing interval
    resetProgressBar();
    autoPlayInterval = setInterval(nextSlide, autoPlayDelay);
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  function restartAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  // Event listeners for navigation buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      restartAutoPlay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      restartAutoPlay();
    });
  }

  // Event listeners for indicators
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      showSlide(index);
      restartAutoPlay();
    });
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Only respond if gallery is in viewport
    const rect = gallery.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;

    if (!isInViewport) return;

    if (e.key === 'ArrowLeft') {
      prevSlide();
      restartAutoPlay();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      restartAutoPlay();
    }
  });

  // Pause autoplay when user hovers over gallery
  gallery.addEventListener('mouseenter', stopAutoPlay);
  gallery.addEventListener('mouseleave', startAutoPlay);

  // Pause autoplay when page is not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  });

  // Touch/swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  gallery.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoPlay();
  }, { passive: true });

  gallery.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    startAutoPlay();
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next slide
        nextSlide();
      } else {
        // Swipe right - prev slide
        prevSlide();
      }
    }
  }

  // Initialize gallery
  showSlide(0);

  // Start autoplay when gallery enters viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        startAutoPlay();
      } else {
        stopAutoPlay();
      }
    });
  }, { threshold: 0.5 });

  observer.observe(gallery);
})();

document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('form.modern-contact');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Форма демо. Подключим отправку позже.');
  });
});


