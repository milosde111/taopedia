import type { APIRoute } from 'astro';
import { historyForSlug } from '../lib/article-history';
import { buildJsonFeed } from '../../scripts/json-feed.js';
import slugMap from '../../public/data/slugmap.json';

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://taopedia.org');
  const origin = base.origin;

  // Mirror /rss.xml: same canonical article URLs and newest-first ordering, but
  // serialize as JSON Feed 1.1 for clients that prefer JSON over XML.
  // Read public/data/slugmap.json — the same title/summary/categories artifact
  // search-data.json (#1405) and sitemap.xml (#1416) already use — instead of
  // calling getCollection('pages') and re-reading every article's frontmatter.
  const items = Object.entries(slugMap).map(([slug, entry]) => {
    const history = historyForSlug(slug);
    const dateModified = history[0]?.date ?? '';
    const datePublished = history[history.length - 1]?.date ?? '';
    return {
      title: entry?.title ?? slug,
      url: `${origin}/wiki/${slug}/`,
      image: `${origin}/og/${slug}.png`,
      description: entry?.summary ?? '',
      categories: entry?.categories ?? [],
      datePublished,
      dateModified,
    };
  });

  const body = buildJsonFeed({ siteUrl: `${origin}/`, items });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
    },
  });
};
