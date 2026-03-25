/* ================================================
   AR Grounds — gallery.js
   Before/after gallery filter tabs
   ================================================ */

(function () {
  'use strict';

  const filterBtns = document.querySelectorAll('.gallery-filter');
  const cards = document.querySelectorAll('.gallery-card');

  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active state
      filterBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      // Filter cards
      cards.forEach((card) => {
        const type = card.dataset.type;
        const match = filter === 'all' || type === filter;
        card.style.display = match ? '' : 'none';
        
        // Re-trigger reveal animation for visible cards
        if (match) {
          card.classList.remove('is-visible');
          // Small delay so IntersectionObserver re-picks it up
          setTimeout(() => card.classList.add('is-visible'), 20);
        }
      });
    });
  });

  // Photo lightbox for real images (future use)
  // When owner replaces placeholders with <img> tags, clicking them will open
  // a larger view. Stub is ready below.
  document.querySelectorAll('.gallery-panel img').forEach((img) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      openLightbox(img.src, img.alt);
    });
  });

  function openLightbox(src, alt) {
    let lightbox = document.getElementById('gallery-lightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'gallery-lightbox';
      lightbox.style.cssText = [
        'position:fixed;inset:0;background:rgba(0,0,0,0.92);',
        'z-index:9999;display:flex;align-items:center;justify-content:center;',
        'cursor:zoom-out;padding:24px;',
      ].join('');
      lightbox.addEventListener('click', () => lightbox.remove());
      document.body.appendChild(lightbox);
    } else {
      lightbox.innerHTML = '';
    }

    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    img.style.cssText = 'max-width:90vw;max-height:88vh;border-radius:12px;object-fit:contain;';
    lightbox.appendChild(img);
  }

})();
