import axios from 'axios';
import type { Router } from 'express';
import type { RouteContext } from '../context.js';

export function registerProxyImageRoutes(router: Router, ctx: RouteContext): void {
  const { auth } = ctx;

  router.get('/proxy-image', async (req, res) => {
    if (!(await auth.requireAuth(req, res))) return;

    const imageUrl = req.query.url;
    if (!imageUrl || typeof imageUrl !== 'string') {
      res.status(400).json({ error: 'Missing or invalid url parameter' });
      return;
    }

    // Only allow proxying Ravelry image URLs for security
    if (!imageUrl.includes('ravelrycache.com') && !imageUrl.includes('ravelry.com')) {
      res.status(400).json({ error: 'Only Ravelry image URLs are allowed' });
      return;
    }

    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });

      const contentType = response.headers['content-type'] || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      res.send(Buffer.from(response.data));
    } catch (_error: any) {
      res.status(500).json({ error: 'Failed to fetch image' });
    }
  });
}
