/* ==========================================================================
   IdeanaX — Home Page
   Handles: chip filter, search, bookmark toggle, load more, waveform,
   theme toggle, search focus shortcut.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initWaveform();
  initBookmarks();
  initChipFilter();
  initSearch();
  initLoadMore();
  initThemeToggle();
});

/* ---------------------------------------------------------------------
   Waveform — generate bars for the Audio Preset card's inline SVG
   ------------------------------------------------------------------ */
function initWaveform() {
  const waveSvg = document.querySelector('#wave');
  if (!waveSvg) return;

  const barCount = 46;
  const gap = 2.2;
  const barWidth = (300 / barCount) - gap;
  let seed = 42;

  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  let x = 0;
  for (let i = 0; i < barCount; i++) {
    const t = i / barCount;
    const envelope = Math.sin(t * Math.PI) * 0.8 + 0.2;
    const heightPct = Math.max(0.12, Math.min(1, envelope * (0.5 + rand() * 0.6)));
    const barHeight = heightPct * 56;
    const y = (80 - barHeight) / 2;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x.toFixed(2));
    rect.setAttribute('y', y.toFixed(2));
    rect.setAttribute('width', barWidth.toFixed(2));
    rect.setAttribute('height', barHeight.toFixed(2));
    rect.setAttribute('rx', '1.2');
    rect.setAttribute('fill', 'rgba(20,184,166,0.65)');
    waveSvg.appendChild(rect);
    x += barWidth + gap;
  }
}

/* ---------------------------------------------------------------------
   Bookmark toggle
   ------------------------------------------------------------------ */
function initBookmarks() {
  document.querySelectorAll('.bookmark-flat').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.classList.toggle('saved');
      const icon = btn.querySelector('svg path');
      if (btn.classList.contains('saved') && icon) {
        btn.querySelector('svg path').setAttribute('fill', 'var(--purple-2)');
        btn.style.color = 'var(--purple-2)';
      } else if (icon) {
        btn.querySelector('svg path').setAttribute('fill', 'none');
        btn.style.color = '';
      }
    });
  });
}

/* ---------------------------------------------------------------------
   Chip filter — shows/hides cards by data-filter attribute
   ------------------------------------------------------------------ */
function initChipFilter() {
  const chipRow = document.getElementById('chipRow');
  if (!chipRow) return;

  chipRow.querySelectorAll('.chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      chipRow.querySelectorAll('.chip[data-filter]').forEach(c => c.classList.remove('chip-active'));
      chip.classList.add('chip-active');

      const filter = chip.dataset.filter;
      document.querySelectorAll('#cardGrid .card').forEach(card => {
        const match = filter === 'all' || card.dataset.filter === filter;
        card.style.display = match ? '' : 'none';
      });

      // clear search box when switching chip
      const input = document.getElementById('mainSearchInput');
      if (input) input.value = '';
    });
  });
}

/* ---------------------------------------------------------------------
   Search — filters cards by title text
   ------------------------------------------------------------------ */
function initSearch() {
  const input = document.getElementById('mainSearchInput');
  if (!input) return;

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();

    // reset chips to "All" when searching
    if (query) {
      const chipRow = document.getElementById('chipRow');
      chipRow?.querySelectorAll('.chip[data-filter]').forEach(c => c.classList.remove('chip-active'));
      chipRow?.querySelector('[data-filter="all"]')?.classList.add('chip-active');
    }

    document.querySelectorAll('#cardGrid .card').forEach(card => {
      const title = card.dataset.title?.toLowerCase() || card.querySelector('h3')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
      const matches = !query || title.includes(query) || desc.includes(query);
      card.style.display = matches ? '' : 'none';
    });
  });
}

/* ---------------------------------------------------------------------
   Load More — appends extra cards with a loading state
   ------------------------------------------------------------------ */
function initLoadMore() {
  const btn = document.getElementById('loadMoreBtn');
  if (!btn) return;

  let loaded = false;

  btn.addEventListener('click', () => {
    if (loaded) return;
    btn.classList.add('is-loading');
    btn.disabled = true;

    setTimeout(() => {
      const grid = document.getElementById('cardGrid');
      const extras = [
        {
          filter: 'writing',
          title: 'Viral Hooks Prompt',
          desc: 'Generate scroll-stopping hooks for short-form content...',
          badge: 'PROMPT',
          badgeClass: 'badge-prompt',
          img: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80',
          alt: 'Writing desk with notebook',
          stat: '❤️',
          count: '1.9k'
        },
        {
          filter: 'marketing',
          title: 'Ad Copy Prompt',
          desc: 'Write high-converting ad copy for any product...',
          badge: 'PROMPT',
          badgeClass: 'badge-prompt',
          img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80',
          alt: 'Marketing analytics dashboard',
          stat: '❤️',
          count: '3.0k'
        },
        {
          filter: 'reels',
          title: 'Reels Hook Prompt',
          desc: 'Open your Reels with an irresistible first 3 seconds...',
          badge: 'PROMPT',
          badgeClass: 'badge-prompt',
          img: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=600&q=80',
          alt: 'Phone showing vertical short video',
          stat: '❤️',
          count: '4.1k'
        },
        {
          filter: 'image',
          title: 'Product Photo Prompt',
          desc: 'Studio-quality product photography with AI...',
          badge: 'PROMPT',
          badgeClass: 'badge-prompt',
          img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
          alt: 'Elegant product on minimal background',
          stat: '❤️',
          count: '2.7k'
        }
      ];

      extras.forEach(item => {
        const article = document.createElement('article');
        article.className = 'card';
        article.dataset.filter = item.filter;
        article.dataset.title = item.title;
        article.innerHTML = `
          <div class="card-media">
            <span class="badge ${item.badgeClass}">${item.badge}</span>
            <img src="${item.img}" alt="${item.alt}">
            <button class="bookmark-flat" aria-label="Save">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
          </div>
          <div class="card-body">
            <h3>${item.title}</h3>
            <p>${item.desc}</p>
            <div class="card-footer">
              <span class="stat">
                <svg class="stat-heart" width="13" height="13" viewBox="0 0 24 24" fill="#f43f5e" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                ${item.count}
              </span>
              <button class="bookmark-flat" style="position:static;background:transparent;backdrop-filter:none;" aria-label="Save">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
            </div>
          </div>`;
        grid.appendChild(article);
      });

      // re-bind bookmarks on new cards
      grid.querySelectorAll('.bookmark-flat').forEach(b => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          b.classList.toggle('saved');
        });
      });

      btn.classList.remove('is-loading');
      btn.innerHTML = 'All loaded';
      btn.disabled = true;
      loaded = true;
    }, 800);
  });
}

/* ---------------------------------------------------------------------
   Theme toggle
   ------------------------------------------------------------------ */
function initThemeToggle() {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const root = document.documentElement;
    const isLight = root.getAttribute('data-theme') === 'light';
    root.setAttribute('data-theme', isLight ? 'dark' : 'light');
  });
}
