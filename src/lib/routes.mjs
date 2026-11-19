// IZY URL standard (client-site-mapping, every client): every page URL carries
// the target keyword and nothing else. No navigation word (services, service-area,
// locations) appears in any URL below its hub. Lowercase, hyphens, trailing slash.
//
//   Main service page   /[service-keyword]/            /dryer-repair/
//   Main city page      /[city]/[umbrella-keyword]/    /austin/appliance-repair/
//   City service page   /[city]/[service-keyword]/     /austin/dryer-repair/
//   County page (opt.)  /[county]/[umbrella-keyword]/  /travis-county/appliance-repair/
//   Brand page (opt.)   /[brand-keyword]/              /sub-zero-appliance-repair/
//   Hubs                /services/  /service-area/  (brand hub slug from site.json)
//   Core                /about/ /faq/ /reviews/ /blog/ /contact/ + any /[slug]/ page
//
// Changing this file changes every URL on the site: Artem's sign-off required.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const site = JSON.parse(readFileSync(join(process.cwd(), 'content', 'site.json'), 'utf8'));
export const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const UMBRELLA = slugify(site.umbrellaKeyword ?? 'services');

export const routes = {
  home: () => '/',
  servicesHub: () => '/services/',
  service: (service) => `/${service}/`,
  areasHub: () => '/service-area/',
  county: (county) => `/${county}/${UMBRELLA}/`,
  city: (city) => `/${city}/${UMBRELLA}/`,
  cityService: (city, service) => `/${city}/${service}/`,
  brandsHub: () => `/${site.brandsHub?.slug ?? 'brands'}/`,
  brand: (brand) => `/${brand}/`,
  blogHub: () => '/blog/',
  blogPost: (slug) => `/blog/${slug}/`,
  about: () => '/about/',
  faq: () => '/faq/',
  reviews: () => '/reviews/',
  contact: () => '/contact/',
  page: (slug) => `/${slug}/`,
};

// Top-level slugs owned by fixed pages; services, cities, counties, brands and
// extra pages may not reuse them.
export const RESERVED_ROOT_SLUGS = ['services', 'service-area', 'blog', 'about', 'faq', 'reviews', 'contact', 'sitemap.xml', 'robots.txt', 'llms.txt', '404', site.brandsHub?.slug ?? 'brands'];

// Page types that count as location pages (their FAQs must never repeat).
export const LOCATION_TYPES = ['county', 'city', 'city-service'];
