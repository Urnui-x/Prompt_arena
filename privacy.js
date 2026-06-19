// ===========================================================
// IDEANAX — Terms and Conditions Page
// Standalone JS. No shared/external script dependencies.
// ===========================================================

document.addEventListener('DOMContentLoaded', () => {
  const tocLinks = Array.from(document.querySelectorAll('.toc-link'));
  const sections = tocLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = (id) => {
    tocLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  };

  // Highlight the section currently in view as the user scrolls.
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length > 0) {
        setActive(visible[0].target.id);
      }
    },
    {
      rootMargin: '-15% 0px -55% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    }
  );

  sections.forEach((section) => observer.observe(section));

  // Smooth-scroll offset for the sticky navbar when a TOC link is clicked.
  tocLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();
      const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 72;
      const top = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 16;

      window.scrollTo({ top, behavior: 'smooth' });
      setActive(targetId);
    });
  });
});
