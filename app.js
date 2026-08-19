let POSTS          = [];  
let nextCursor     = null;
let currentFilter  = 'all';
let displayedCount = 12;
const likedPosts   = new Set();
const savedPosts   = new Set();

function fmt(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n);
}

function filteredPosts() {
  return currentFilter === 'all'
    ? POSTS
    : POSTS.filter(p => p.type === currentFilter);
}

function buildTile(post, minHeight) {
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    position:absolute;inset:0;
    background:${post.bg || '#0c1530'};
    display:flex;
    align-items:center;
    justify-content:center;
    padding:24px;
    ${minHeight ? 'min-height:' + minHeight + ';' : ''}
  `;
  if (post.quoteText) {
    const q = document.createElement('p');
    q.style.cssText = `
      font-size:clamp(0.8rem,1.4vw,1.1rem);
      font-weight:500;
      line-height:1.45;
      letter-spacing:-0.01em;
      color:${post.textColor || '#d4d4d4'};
      text-align:center;
    `;
    q.textContent = post.quoteText;
    wrap.appendChild(q);
  } else {
    const l = document.createElement('span');
    l.style.cssText = `
      font-family:'Geist Mono',monospace;
      font-size:0.65rem;
      letter-spacing:0.14em;
      text-transform:uppercase;
      color:${post.accentColor || '#7a8aa8'};
    `;
    l.textContent = post.label || post.type || '';
    wrap.appendChild(l);
  }
  return wrap;
}

function showLoading() {
  const grid = document.getElementById('feed-grid');
  grid.innerHTML = `
    <div class="feed-empty" style="letter-spacing:0.12em;">
      Loading posts...
    </div>`;
  document.getElementById('load-more-btn').style.display = 'none';
}

function renderFeed() {
  const grid  = document.getElementById('feed-grid');
  const posts = filteredPosts().slice(0, displayedCount);
  const btn   = document.getElementById('load-more-btn');

  grid.innerHTML = '';

  if (!posts.length) {
    grid.innerHTML = '<div class="feed-empty">No posts in this category yet.</div>';
    btn.style.display = 'none';
    return;
  }

  posts.forEach((post, i) => {
    const card = document.createElement('div');
    card.className = 'post-card' + (post.featured ? ' featured' : '');
    card.dataset.id = post.id;

    if (post.isReal && post.mediaUrl) {
      // Real Instagram image 
      const img = document.createElement('img');
      img.src = post.mediaUrl;
      img.alt = post.caption ? post.caption.slice(0, 60) : 'Instagram post';
      img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
      img.onerror = () => {
        img.remove();
        card.insertBefore(buildTile(post, null), card.firstChild);
      };
      card.appendChild(img);
    } else {
      card.appendChild(buildTile(post, null));
    }

    // Type tag
    const tag = document.createElement('span');
    tag.className = 'post-type-tag';
    tag.textContent = { reel: 'Reel', image: 'Post' }[post.type] || 'Post';
    card.appendChild(tag);

    // Hover overlay with stats
    const overlay = document.createElement('div');
    overlay.className = 'post-overlay';
    const statsEl = document.createElement('div');
    statsEl.className = 'post-stats';
    statsEl.innerHTML = `
      <span class="post-stat-item">${fmt(post.likes + (likedPosts.has(post.id) ? 1 : 0))} likes</span>
      <span class="post-stat-item">${fmt(post.comments)} comments</span>
    `;
    overlay.appendChild(statsEl);
    card.appendChild(overlay);

    card.addEventListener('click', () => openModal(post));
    grid.appendChild(card);
  });

  const total = filteredPosts().length;
  btn.style.display = (displayedCount < total || nextCursor) ? '' : 'none';
}

function openModal(post) {
  const overlay = document.getElementById('modal-overlay');
  const visual  = document.getElementById('modal-visual');

  visual.innerHTML = '';

  if (post.isReal && post.mediaUrl) {
    if (post.type === 'reel' && post.videoUrl) {
      // Real Instagram video (Reel)
      const vid = document.createElement('video');
      vid.src = post.videoUrl;
      vid.autoplay = true;
      vid.controls = true;
      vid.loop = true;
      vid.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;';
      visual.appendChild(vid);
    } else {
      // Real Instagram image 
      const img = document.createElement('img');
      img.src = post.mediaUrl;
      img.alt = post.caption ? post.caption.slice(0, 60) : 'Instagram post';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => {
        img.remove();
        const tile = buildTile(post, null);
        tile.style.position = 'relative';
        tile.style.inset    = 'auto';
        tile.style.height   = '100%';
        visual.appendChild(tile);
      };
      visual.appendChild(img);
    }
  } else {
    // Colour tile
    const tile = buildTile(post, null);
    tile.style.position = 'relative';
    tile.style.inset    = 'auto';
    tile.style.height   = '100%';
    visual.appendChild(tile);
  }


  document.getElementById('modal-date').textContent    = post.date;
  document.getElementById('modal-caption').textContent = post.caption || '';

  const tagsEl = document.getElementById('modal-tags');
  tagsEl.innerHTML = (post.tags || []).map(t => `<span class="modal-tag">${t}</span>`).join('');

  const existingLink = document.getElementById('modal-ig-link');
  if (existingLink) existingLink.remove();
  if (post.permalink) {
    const link = document.createElement('a');
    link.id   = 'modal-ig-link';
    link.href = post.permalink;
    link.target = '_blank';
    link.rel  = 'noopener';
    link.textContent = 'View on Instagram';
    link.style.cssText = `
      font-family:'Geist Mono',monospace;
      font-size:0.7rem;
      letter-spacing:0.08em;
      color:var(--accent);
      text-decoration:none;
      border-bottom:1px solid rgba(200,169,126,0.3);
      padding-bottom:2px;
      align-self:flex-start;
    `;
    tagsEl.after(link);
  }

  const likeBtn = document.getElementById('modal-like-btn');
  const saveBtn = document.getElementById('modal-save-btn');

  function syncLike() {
    const liked = likedPosts.has(post.id);
    likeBtn.textContent = fmt(post.likes + (liked ? 1 : 0)) + ' likes';
    likeBtn.classList.toggle('liked', liked);
  }

  syncLike();
  saveBtn.classList.toggle('saved', savedPosts.has(post.id));
  saveBtn.textContent = savedPosts.has(post.id) ? 'Saved' : 'Save';

  likeBtn.onclick = () => {
    likedPosts.has(post.id) ? likedPosts.delete(post.id) : likedPosts.add(post.id);
    syncLike();
    renderFeed();
  };

  saveBtn.onclick = () => {
    savedPosts.has(post.id) ? savedPosts.delete(post.id) : savedPosts.add(post.id);
    saveBtn.classList.toggle('saved', savedPosts.has(post.id));
    saveBtn.textContent = savedPosts.has(post.id) ? 'Saved' : 'Save';
  };

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
  const vid = document.querySelector('#modal-visual video');
  if (vid) vid.pause();
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

document.getElementById('feed-tabs').addEventListener('click', e => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  tab.classList.add('active');
  tab.setAttribute('aria-selected', 'true');
  currentFilter  = tab.dataset.filter;
  displayedCount = 12;
  renderFeed();
});


document.getElementById('load-more-btn').addEventListener('click', async () => {
  const btn = document.getElementById('load-more-btn');
  const currentTotal = filteredPosts().length;

  // If we're about to run out of filtered posts and there's another page
  if (displayedCount + 4 > currentTotal && nextCursor) {
    const originalText = btn.textContent;
    btn.textContent = 'Loading...';
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';

    try {
      const { posts, nextCursor: newCur } = await fetchInstagramPosts(nextCursor);
      POSTS.push(...posts);
      nextCursor = newCur;
    } catch (err) {
      console.warn('[THRM] Failed to load more posts', err);
    }

    btn.textContent = originalText;
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
  }

  displayedCount += 4;
  renderFeed();
});

// ── NAVBAR ───────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', open);
  mobileMenu.setAttribute('aria-hidden', !open);
});

mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});

function animateCount(el, target, duration) {
  let start;
  const step = ts => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(eased * target);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const heroObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    document.querySelectorAll('.stat-number').forEach(el => {
      animateCount(el, parseInt(el.dataset.target, 10), 1600);
    });
    heroObserver.disconnect();
  }
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-meta');
if (heroStats) heroObserver.observe(heroStats);

document.querySelectorAll([
  '.section-header',
  '.about-left',
  '.about-right',
  '.contact-form',
].join(',')).forEach(el => el.classList.add('reveal'));

const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ── CONTACT FORM ─────────────────────────────────────────────
// document.getElementById('contact-form').addEventListener('submit', e => {
//   e.preventDefault();
//   const btn     = document.getElementById('send-btn');
//   const success = document.getElementById('form-success');
//   btn.textContent  = 'Sending...';
//   btn.style.opacity = '0.6';

//   setTimeout(() => {
//     btn.textContent  = 'Send message';
//     btn.style.opacity = '1';
//     success.classList.add('visible');
//     e.target.reset();
//     setTimeout(() => success.classList.remove('visible'), 4000);
//   }, 1000);
// });

function applyAccountStats(stats) {
  if (!stats) return;

  // Format numbers: e.g. 24700 → "24.7K", 1123 → "1123"
  function fmtStat(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  const statEls = document.querySelectorAll('.hero-stat');

  // Followers — first stat
  if (statEls[0] && stats.followers) {
    const numEl  = statEls[0].querySelector('.stat-number');
    const unitEl = statEls[0].querySelector('.stat-unit');
    const formatted = fmtStat(stats.followers);
    // Split "24.7K" → number part "24.7", unit part "K"
    const match = formatted.match(/^([\d.]+)([KM]?)$/);
    if (match && numEl && unitEl) {
      numEl.dataset.target = match[1];
      unitEl.textContent   = match[2];
      animateCount(numEl, parseFloat(match[1]), 1600);
    }
  }

  // Posts — second stat
  if (statEls[1] && stats.posts) {
    const numEl  = statEls[1].querySelector('.stat-number');
    const unitEl = statEls[1].querySelector('.stat-unit');
    const formatted = fmtStat(stats.posts);
    const match = formatted.match(/^([\d.]+)([KM]?)$/);
    if (match && numEl && unitEl) {
      numEl.dataset.target = match[1];
      unitEl.textContent   = match[2] + '+';
      animateCount(numEl, parseFloat(match[1]), 1600);
    }
  }

  // Engagement rate — third stat
  if (statEls[2] && stats.engagement !== undefined) {
    const numEl  = statEls[2].querySelector('.stat-number');
    const unitEl = statEls[2].querySelector('.stat-unit');
    const rate   = stats.engagement.toFixed(1);
    if (numEl && unitEl) {
      numEl.dataset.target = rate;
      unitEl.textContent   = '%';
      animateCount(numEl, parseFloat(rate), 1600);
    }
  }
}

async function init() {
  showLoading();

  const [{ posts, nextCursor: cur }, stats] = await Promise.all([
    fetchInstagramPosts(),
    fetchAccountStats(),
  ]);

  POSTS = posts;
  nextCursor = cur;
  renderFeed();
  applyAccountStats(stats);
}

init();
