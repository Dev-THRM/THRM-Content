/* ===================================================
   instagram-api.js
   Fetches real posts from the Instagram Graph API
   and maps them into the post format used by app.js.
   Falls back to DUMMY_POSTS if the fetch fails or
   the token has not been configured yet.
=================================================== */

// ── FALLBACK DUMMY POSTS ─────────────────────────────────────
// Used when the token is not yet set or the API call fails.
const DUMMY_POSTS = [
  {
    id: 'd1',
    type: 'quote',
    featured: false,
    bg: '#111111',
    textColor: '#d4d4d4',
    quoteText: 'Create content that does not just scroll past. It stops, sparks, and stays.',
    caption: 'Every piece of content we create is a conversation starter. What is your brand saying to the world?',
    tags: ['#ContentCreation', '#THRM', '#CreativeStudio', '#BrandVoice'],
    likes: 4812,
    comments: 237,
    date: '2 hours ago',
    isReal: false,
  },
  {
    id: 'd2',
    type: 'bts',
    bg: '#0f1117',
    accentColor: '#8a8a8a',
    label: 'Behind the Lens',
    caption: 'Another day, another shoot. The studio is running a new campaign that drops this Friday.',
    tags: ['#BTS', '#Photoshoot', '#ContentCreator', '#StudioLife'],
    likes: 3291,
    comments: 145,
    date: '1 day ago',
    isReal: false,
  },
  {
    id: 'd3',
    type: 'quote',
    bg: '#0e0e10',
    textColor: '#c8c8c8',
    quoteText: 'Consistency is the difference between good and legendary.',
    caption: 'Post every day. Show up every day. Your audience is watching.',
    tags: ['#Motivation', '#ContentTips', '#THRM', '#Mindset'],
    likes: 6704,
    comments: 412,
    date: '2 days ago',
    isReal: false,
  },
  {
    id: 'd4',
    type: 'collab',
    bg: '#0a0f0e',
    accentColor: '#6b7c79',
    label: 'Collab',
    caption: 'Big things are coming. We teamed up with some incredible creators this month.',
    tags: ['#Collab', '#Partnership', '#ContentCreators', '#THRM'],
    likes: 5238,
    comments: 309,
    date: '3 days ago',
    isReal: false,
  },
  {
    id: 'd5',
    type: 'reel',
    bg: '#0d0d14',
    accentColor: '#7a7a9a',
    label: 'Reel',
    quoteText: 'Day in the life of a content creator.',
    caption: 'From concept to creation. A raw look at how we build content from scratch. Link in bio.',
    tags: ['#Reel', '#DayInTheLife', '#ContentCreator', '#THRM'],
    likes: 12400,
    comments: 891,
    date: '4 days ago',
    isReal: false,
  },
  {
    id: 'd6',
    type: 'quote',
    bg: '#110e0a',
    textColor: '#c8a97e',
    quoteText: 'Your story is your brand. Own it.',
    caption: 'There is only one you. That authenticity is your greatest marketing tool.',
    tags: ['#Authenticity', '#BrandBuilding', '#THRM'],
    likes: 7821,
    comments: 524,
    date: '5 days ago',
    isReal: false,
  },
];

// ── BG PALETTE for real posts ────────────────────────────────
// Rotated through so each real post gets a distinct dark tile.
const BG_PALETTE = [
  { bg: '#0f0f12', textColor: '#d4d4d4' },
  { bg: '#0c0f14', textColor: '#c8d4d8' },
  { bg: '#110e0a', textColor: '#c8b89a' },
  { bg: '#0a0f0e', textColor: '#a8c4b8' },
  { bg: '#0d0a12', textColor: '#c0b4d4' },
  { bg: '#0f1117', textColor: '#b8c8d8' },
  { bg: '#12100a', textColor: '#d4c8a0' },
  { bg: '#0a0e14', textColor: '#b0bcd4' },
  { bg: '#110a0e', textColor: '#d4b0bc' },
];

// ── TYPE DETECTION ───────────────────────────────────────────
// Instagram media types: IMAGE, VIDEO, CAROUSEL_ALBUM
function detectType(mediaType) {
  if (mediaType === 'VIDEO') return 'reel';
  if (mediaType === 'CAROUSEL_ALBUM') return 'collab';
  return 'quote'; // IMAGE — treat as a quote/graphic post
}

// ── CAPTION PARSING ──────────────────────────────────────────
function parseCaption(rawCaption) {
  if (!rawCaption) return { text: '', tags: [] };
  const lines  = rawCaption.split('\n');
  const tags   = [];
  const textLines = [];

  lines.forEach(line => {
    const words = line.trim().split(/\s+/);
    const lineHasTags = words.some(w => w.startsWith('#'));
    if (lineHasTags) {
      words.forEach(w => { if (w.startsWith('#')) tags.push(w); });
    } else {
      textLines.push(line.trim());
    }
  });

  return {
    text: textLines.filter(Boolean).join(' '),
    tags: tags.slice(0, 6), // show max 6 tags
  };
}

// ── TIME AGO ─────────────────────────────────────────────────
function timeAgo(isoString) {
  const now   = Date.now();
  const then  = new Date(isoString).getTime();
  const diff  = Math.floor((now - then) / 1000);

  if (diff < 3600)  return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return `${Math.floor(diff / 604800)} weeks ago`;
}

// ── MAP API RESPONSE → POST OBJECT ───────────────────────────
function mapIgPost(igPost, index) {
  const { text, tags } = parseCaption(igPost.caption);
  const palette = BG_PALETTE[index % BG_PALETTE.length];
  const type    = detectType(igPost.media_type);

  return {
    id:         igPost.id,
    type,
    featured:   false,
    bg:         palette.bg,
    textColor:  palette.textColor,
    quoteText:  igPost.media_type === 'IMAGE' ? (text.split('.')[0] || text).slice(0, 100) : null,
    label:      type === 'reel' ? 'Reel' : type === 'collab' ? 'Carousel' : null,
    caption:    text,
    tags,
    likes:      igPost.like_count    || 0,
    comments:   igPost.comments_count || 0,
    date:       timeAgo(igPost.timestamp),
    permalink:  igPost.permalink,
    // Videos: use thumbnail_url (cover frame) since media_url is an .mp4
    // Images and carousels: media_url is a regular JPEG/PNG
    mediaUrl:   igPost.media_type === 'VIDEO'
                  ? (igPost.thumbnail_url || igPost.media_url || null)
                  : (igPost.media_url || igPost.thumbnail_url || null),
    isReal:     true,
  };
}

// ── FETCH ACCOUNT STATS ──────────────────────────────────────
// Returns followers count, total posts, and engagement rate.
async function fetchAccountStats() {
  try {
    // 1. Account-level fields
    const accountUrl = new URL(window.location.href.split('/').slice(0, -1).join('/') + '/instagram.php');
    accountUrl.searchParams.set('action', 'stats');

    const accountRes = await fetch(accountUrl.toString());
    if (!accountRes.ok) throw new Error(`Account fetch failed: ${accountRes.status}`);
    const account = await accountRes.json();
    
    if (account.error) throw new Error(account.error);

    // 2. Fetch recent posts for engagement calculation
    const mediaUrl = new URL(window.location.href.split('/').slice(0, -1).join('/') + '/instagram.php');
    mediaUrl.searchParams.set('action', 'recent_media');
    mediaUrl.searchParams.set('limit', '30'); // last 30 posts

    const mediaRes  = await fetch(mediaUrl.toString());
    const mediaJson = mediaRes.ok ? await mediaRes.json() : { data: [] };
    const posts     = mediaJson.data || [];


    // 3. Calculate engagement rate
    // Formula: avg (likes + comments) per post / followers * 100
    let engagementRate = 0;
    if (posts.length > 0 && account.followers_count > 0) {
      const totalInteractions = posts.reduce(
        (sum, p) => sum + (p.like_count || 0) + (p.comments_count || 0), 0
      );
      const avgInteractions = totalInteractions / posts.length;
      engagementRate = ((avgInteractions / account.followers_count) * 100);
    }

    console.info('[THRM] Account stats fetched.', account);

    return {
      followers:   account.followers_count || 0,
      posts:       account.media_count     || 0,
      engagement:  engagementRate,
      username:    account.username        || '',
    };

  } catch (err) {
    console.warn('[THRM] Could not fetch account stats.', err.message);
    return null;
  }
}

// ── FETCH FROM API ───────────────────────────────────────────
async function fetchInstagramPosts() {
  const url = new URL(window.location.href.split('/').slice(0, -1).join('/') + '/instagram.php');
  url.searchParams.set('action', 'posts');
  url.searchParams.set('limit',  INSTAGRAM_CONFIG.POSTS_PER_PAGE * 2);

  try {
    const res = await fetch(url.toString());


    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const json  = await res.json();
    const items = (json.data || []).filter(p =>
      p.media_type === 'IMAGE' || p.media_type === 'VIDEO' || p.media_type === 'CAROUSEL_ALBUM'
    );

    const posts = items.map(mapIgPost);
    console.info(`[THRM] Loaded ${posts.length} real posts from Instagram.`);
    return { posts, source: 'instagram' };

  } catch (err) {
    console.warn('[THRM] Instagram API error — falling back to dummy posts.', err.message);
    return { posts: DUMMY_POSTS, source: 'dummy' };
  }
}
