import { caseStudies } from '../data/projects';
import { features } from '../data/features';

export function GET() {
  const routes = ['/', '/world/', '/features/', '/labs/', '/labs/memory/', '/labs/workbench/', '/labs/recovery/', '/labs/studio/', '/labs/gateway/', '/releases/', '/about-the-demos/', ...caseStudies.map(project => `/work/${project.slug}/`), ...features.map(feature => `/features/${feature.slug}/`)];
  const entries = routes.map(route => `<url><loc>https://danishdave.com${route}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
