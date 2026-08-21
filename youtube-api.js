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
function detectType(mediaType) {
  if (mediaType === 'VIDEO') return 'reel';
  return 'image'; // IMAGE and CAROUSEL_ALBUM
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
function mapYtPost(ytPost, index) {
  const { text, tags } = parseCaption(ytPost.snippet.description);
  const palette = BG_PALETTE[index % BG_PALETTE.length];
  
  // Every video is considered a "reel" (Shorts/Video)
  const type = 'reel';
  const videoId = ytPost.contentDetails?.videoId;
  
  const stats = ytPost.video_details?.statistics || {};
  const thumbnails = ytPost.snippet.thumbnails || {};
  const mediaUrl = (thumbnails.maxres || thumbnails.high || thumbnails.medium || thumbnails.default || {}).url;

  return {
    id:         videoId,
    type,
    featured:   false,
    bg:         palette.bg,
    textColor:  palette.textColor,
    quoteText:  ytPost.snippet.title,
    label:      'Short',
    caption:    text,
    tags,
    likes:      parseInt(stats.likeCount || 0, 10),
    comments:   parseInt(stats.commentCount || 0, 10),
    views:      parseInt(stats.viewCount || 0, 10),
    date:       timeAgo(ytPost.snippet.publishedAt),
    permalink:  `https://www.youtube.com/watch?v=${videoId}`,
    mediaUrl:   mediaUrl,
    videoUrl:   videoId, // Using videoUrl field to store the YT Video ID
    isReal:     true,
  };
}

// ── FETCH ACCOUNT STATS ──────────────────────────────────────
async function fetchAccountStats() {
  try {
    const accountUrl = new URL('youtube.php', window.location.href);
    accountUrl.searchParams.set('action', 'stats');

    const accountRes = await fetch(accountUrl.toString());
    if (!accountRes.ok) throw new Error(`Account fetch failed: ${accountRes.status}`);
    const json = await accountRes.json();
    
    if (json.error) throw new Error(json.error);
    if (!json.items || json.items.length === 0) throw new Error("Channel not found");

    const channel = json.items[0];
    const stats = channel.statistics || {};

    console.info('[THRM] Account stats fetched.', channel);

    return {
      followers:   parseInt(stats.subscriberCount || 0, 10),
      posts:       parseInt(stats.videoCount || 0, 10),
      engagement:  0, // Engagement rate logic can be updated for YT if needed
      username:    channel.snippet.customUrl || channel.snippet.title,
    };
  } catch (err) {
    console.warn('[THRM] Could not fetch account stats.', err.message);
    return null;
  }
}

// ── FETCH FROM API ───────────────────────────────────────────
async function fetchYouTubePosts(after = null) {
  const url = new URL('youtube.php', window.location.href);
  url.searchParams.set('action', 'posts');
  url.searchParams.set('limit', 50);
  if (after) {
    url.searchParams.set('after', after);
  }

  try {
    const res = await fetch(url.toString());

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const json = await res.json();
    
    if (json.error) throw new Error(json.error);
    
    const items = json.items || [];
    const posts = items.map(mapYtPost);
    
    console.info(`[THRM] Loaded ${posts.length} real posts from YouTube.`);

    return {
      posts: posts,
      nextCursor: json.nextPageToken || null
    };

  } catch (err) {
    console.warn('[THRM] YouTube API error — falling back to dummy posts.', err.message);
    return {
      posts: DUMMY_POSTS,
      nextCursor: null
    };
  }
}
