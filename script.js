/* ==========================================================================
   IdeanaX — AI Assets Library
   Handles: waveform rendering, audio play/pause, search + chip filtering,
   grid/list view toggle, bookmark toggling, file-type "show more",
   clear filters, load more, theme toggle.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initWaveforms();
  initAudioCards();
  initBookmarks();
  initViewToggle();
  initChipFilter();
  initSearch();
  initShowMoreFileType();
  initClearFilters();
  initLoadMore();
  initThemeToggle();
  initSearchFocusShortcut();
});

/* ---------------------------------------------------------------------
   Waveform generation
   Draws a deterministic-but-organic set of bars inside each .waveform
   <svg>, scaled to the viewBox set in the markup (0 0 300 60).
   ------------------------------------------------------------------ */
function initWaveforms() {
  const waveforms = document.querySelectorAll('.waveform');

  waveforms.forEach((svg, idx) => {
    const barCount = 46;
    const gap = 2.2;
    const barWidth = (300 / barCount) - gap;
    let seed = idx * 17 + 7; // simple per-card seed so each waveform looks different

    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    let x = 0;
    for (let i = 0; i < barCount; i++) {
      const t = i / barCount;
      // envelope: louder in the middle, quieter at the edges, plus noise
      const envelope = Math.sin(t * Math.PI) * 0.8 + 0.2;
      const noise = pseudoRandom();
      const heightPct = Math.max(0.12, Math.min(1, envelope * (0.5 + noise * 0.6)));
      const barHeight = heightPct * 56;
      const y = (60 - barHeight) / 2;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x.toFixed(2));
      rect.setAttribute('y', y.toFixed(2));
      rect.setAttribute('width', barWidth.toFixed(2));
      rect.setAttribute('height', barHeight.toFixed(2));
      rect.setAttribute('rx', '1.2');
      rect.dataset.baseHeight = barHeight.toFixed(2);
      rect.dataset.baseY = y.toFixed(2);

      svg.appendChild(rect);
      x += barWidth + gap;
    }
  });
}

/* ---------------------------------------------------------------------
   Audio card play / pause
   Only one preview "plays" at a time. While playing, animate the bars
   near the play position with a lightweight pulse so it reads as live
   audio without needing real sound files.
   ------------------------------------------------------------------ */
function initAudioCards() {
  const playButtons = document.querySelectorAll('.play-btn');
  let activeButton = null;
  let activeAnimationId = null;

  function stopActive() {
    if (activeButton) {
      setButtonState(activeButton, false);
      const svg = activeButton.closest('.audio-card').querySelector('.waveform');
      resetBars(svg);
    }
    if (activeAnimationId) {
      clearInterval(activeAnimationId);
      activeAnimationId = null;
    }
    activeButton = null;
  }

  function setButtonState(btn, playing) {
    btn.dataset.playing = playing ? 'true' : 'false';
    btn.querySelector('.icon-play').style.display = playing ? 'none' : '';
    btn.querySelector('.icon-pause').style.display = playing ? '' : 'none';
  }

  function resetBars(svg) {
    if (!svg) return;
    svg.querySelectorAll('rect').forEach(rect => {
      rect.setAttribute('height', rect.dataset.baseHeight);
      rect.setAttribute('y', rect.dataset.baseY);
      rect.style.fill = '';
    });
  }

  function animateBars(svg) {
    const rects = Array.from(svg.querySelectorAll('rect'));
    let frame = 0;
    return setInterval(() => {
      frame++;
      rects.forEach((rect, i) => {
        const base = parseFloat(rect.dataset.baseHeight);
        const wobble = Math.sin((frame * 0.4) + i * 0.5) * 0.18 + 1;
        const newHeight = Math.max(2, base * wobble);
        const newY = (60 - newHeight) / 2;
        rect.setAttribute('height', newHeight.toFixed(2));
        rect.setAttribute('y', newY.toFixed(2));
      });
    }, 90);
  }

  playButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.audio-card');
      const svg = card.querySelector('.waveform');
      const isPlaying = btn.dataset.playing === 'true';

      if (isPlaying) {
        stopActive();
        return;
      }

      // stop whatever else was playing first
      stopActive();

      setButtonState(btn, true);
      activeButton = btn;
      activeAnimationId = animateBars(svg);

      // auto-stop after the card's stated duration (capped for long ambience clips)
      const durationText = card.querySelector('.duration').textContent.trim();
      const seconds = parseDuration(durationText);
      const capped = Math.min(seconds, 12); // don't actually wait 90s for ambience preview
      setTimeout(() => {
        if (activeButton === btn) stopActive();
      }, capped * 1000);
    });
  });

  function parseDuration(text) {
    const [m, s] = text.split(':').map(Number);
    return (m || 0) * 60 + (s || 0);
  }
}

/* ---------------------------------------------------------------------
   Bookmark toggle (save / unsave an asset card)
   ------------------------------------------------------------------ */
function initBookmarks() {
  document.querySelectorAll('.bookmark-flat').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      btn.classList.toggle('saved');
    });
  });
}

/* ---------------------------------------------------------------------
   Grid / List view toggle
   ------------------------------------------------------------------ */
function initViewToggle() {
  const toggle = document.getElementById('viewToggle');
  const sections = document.getElementById('assetSections');
  if (!toggle || !sections) return;

  toggle.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toggle.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sections.classList.toggle('list-view', btn.dataset.view === 'list');
    });
  });
}

/* ---------------------------------------------------------------------
   Chip filter (category pills) — shows/hides whole asset rows by
   data-category, matching the chip's data-filter.
   ------------------------------------------------------------------ */
function initChipFilter() {
  const chipRow = document.getElementById('chipRow');
  const rows = document.querySelectorAll('.asset-row');
  if (!chipRow) return;

  chipRow.querySelectorAll('.chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      chipRow.querySelectorAll('.chip[data-filter]').forEach(c => c.classList.remove('chip-active'));
      chip.classList.add('chip-active');

      const filter = chip.dataset.filter;
      rows.forEach(row => {
        const match = filter === 'all' || row.dataset.category === filter;
        row.style.display = match ? '' : 'none';
      });
    });
  });
}

/* ---------------------------------------------------------------------
   Search — filters individual cards by title text across all rows.
   Hides a whole row if every card inside it is filtered out.
   ------------------------------------------------------------------ */
function initSearch() {
  const input = document.getElementById('assetSearchInput');
  if (!input) return;

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    const rows = document.querySelectorAll('.asset-row');

    rows.forEach(row => {
      let anyVisible = false;
      row.querySelectorAll('.card').forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
        const matches = !query || title.includes(query) || desc.includes(query);
        card.classList.toggle('is-hidden', !matches);
        if (matches) anyVisible = true;
      });
      row.style.display = anyVisible ? '' : 'none';
    });

    // if searching, reset chip selection visually to "All Assets" since
    // we're now filtering across categories by text
    if (query) {
      const chipRow = document.getElementById('chipRow');
      chipRow?.querySelectorAll('.chip[data-filter]').forEach(c => c.classList.remove('chip-active'));
      chipRow?.querySelector('[data-filter="all"]')?.classList.add('chip-active');
    }
  });
}

/* ---------------------------------------------------------------------
   File type "Show More" — reveals extra checkboxes in the sidebar.
   ------------------------------------------------------------------ */
function initShowMoreFileType() {
  const btn = document.getElementById('showMoreFileType');
  if (!btn) return;

  const extraTypes = ['MOV', 'JPG', 'AIFF', 'ZIP', 'PSD'];
  let expanded = false;

  btn.addEventListener('click', () => {
    expanded = !expanded;
    if (expanded) {
      const list = btn.previousElementSibling;
      extraTypes.forEach(type => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="checkbox"></span> ${type}`;
        li.classList.add('extra-filetype');
        list.appendChild(li);
        li.querySelector('.checkbox').addEventListener('click', (e) => {
          e.target.classList.toggle('checkbox-checked');
        });
      });
      btn.textContent = 'Show Less';
    } else {
      document.querySelectorAll('.extra-filetype').forEach(li => li.remove());
      btn.textContent = 'Show More';
    }
  });
}

/* ---------------------------------------------------------------------
   Checkbox toggling for all sidebar checkboxes (License, categories, etc)
   ------------------------------------------------------------------ */
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('checkbox')) {
    e.target.classList.toggle('checkbox-checked');
  }
  if (e.target.closest('.radio-list li')) {
    const li = e.target.closest('.radio-list li');
    li.parentElement.querySelectorAll('li').forEach(item => item.classList.remove('selected'));
    li.classList.add('selected');
  }
});

/* ---------------------------------------------------------------------
   Clear Filters — resets checkboxes, search box and chip selection.
   ------------------------------------------------------------------ */
function initClearFilters() {
  const btn = document.querySelector('.clear-filters');
  if (!btn) return;

  btn.addEventListener('click', () => {
    document.querySelectorAll('.checkbox').forEach(cb => cb.classList.remove('checkbox-checked'));
    document.querySelectorAll('.extra-filetype').forEach(li => li.remove());

    const showMoreBtn = document.getElementById('showMoreFileType');
    if (showMoreBtn) showMoreBtn.textContent = 'Show More';

    const radioItems = document.querySelectorAll('.radio-list li');
    radioItems.forEach((item, i) => item.classList.toggle('selected', i === 0));

    const searchInput = document.getElementById('assetSearchInput');
    if (searchInput) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
    }

    const chipRow = document.getElementById('chipRow');
    chipRow?.querySelectorAll('.chip[data-filter]').forEach(c => c.classList.remove('chip-active'));
    chipRow?.querySelector('[data-filter="all"]')?.classList.add('chip-active');

    document.querySelectorAll('.asset-row').forEach(row => row.style.display = '');
  });
}

/* ---------------------------------------------------------------------
   Load More — simulates fetching additional assets with a brief
   loading state, then appends a couple of extra template cards.
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
      const templatesGrid = document.querySelector('[data-category="templates"] .card-grid');
      const extras = [
        {
          title: 'Podcast Cover Pack',
          badge: 'Audio',
          badgeClass: 'badge-video',
          img: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&q=80',
          alt: 'Podcast cover art template mockup',
          downloads: '24.6K'
        },
        {
          title: 'Lower Third Pack',
          badge: 'Video',
          badgeClass: 'badge-video',
          img: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&q=80',
          alt: 'Lower third title bar template mockup',
          downloads: '18.9K'
        }
      ];

      extras.forEach(item => {
        const article = document.createElement('article');
        article.className = 'card visual-card';
        article.innerHTML = `
          <div class="card-media">
            <span class="badge ${item.badgeClass}">${item.badge}</span>
            <button class="dl-icon-btn" aria-label="Download"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
            <img src="${item.img}" alt="${item.alt}">
          </div>
          <div class="card-body">
            <h3>${item.title}</h3>
            <div class="card-footer">
              <span class="dl-count"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> ${item.downloads}</span>
            </div>
          </div>`;
        templatesGrid.appendChild(article);
      });

      btn.classList.remove('is-loading');
      btn.innerHTML = 'All assets loaded';
      btn.disabled = true;
      loaded = true;
    }, 900);
  });
}

/* ---------------------------------------------------------------------
   Theme toggle — switches a light "data-theme" attribute on <html>.
   Actual light-mode palette can be layered in CSS via [data-theme="light"].
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

/* ---------------------------------------------------------------------
   Pressing the search icon in the navbar scrolls to and focuses the
   main search input, as a small convenience affordance.
   ------------------------------------------------------------------ */
function initSearchFocusShortcut() {
  const navSearchBtn = document.getElementById('searchToggleBtn');
  const mainSearch = document.getElementById('assetSearchInput');
  if (!navSearchBtn || !mainSearch) return;

  navSearchBtn.addEventListener('click', () => {
    mainSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    mainSearch.focus();
  });
}
