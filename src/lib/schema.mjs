import { plain } from './md.mjs';
// JSON-LD built from content, emitted as one @graph with stable @ids so every page
// points at the same business entity (entity association is what gets a company
// named in AI answers, not just quoted). IZY standard: dual @type plus Wikipedia and
// Productontology additionalType URLs. Everything marked up is visible on the page.

import { loadContent, titleCase, regionFor } from './content.mjs';
import { routes } from './routes.mjs';

const abs = (path) => new URL(path, loadContent().site.url).href;
export const businessId = () => abs('/#business');

export function businessNode() {
  const { site, cities, services } = loadContent();
  const node = {
    '@type': site.schema?.types ?? ['LocalBusiness'],
    '@id': businessId(),
    name: site.name,
    legalName: site.legalName,
    description: site.summary,
    url: abs('/'),
    telephone: site.phoneE164,
    email: site.email,
    priceRange: site.priceRange,
    foundingDate: site.foundingYear ? String(site.foundingYear) : undefined,
    image: site.ogImage ? abs(site.ogImage) : undefined,
    logo: site.logo ? abs(typeof site.logo === 'string' ? site.logo : site.logo.src) : undefined,
    hasMap: site.gbpUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: site.geo && { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    openingHoursSpecification: (site.hours ?? []).map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
    areaServed: cities.map((c) => ({ '@type': 'City', name: `${c.name}, ${regionFor(c)}` })),
    knowsAbout: [titleCase(site.umbrellaKeyword ?? ''), ...services.map((s) => s.name)].filter(Boolean),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: titleCase(site.umbrellaKeyword ?? 'Services'),
      itemListElement: services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: abs(routes.service(s.slug)) } })),
    },
    sameAs: [site.gbpUrl, ...(site.sameAs ?? [])].filter(Boolean),
  };
  if (site.schema?.additionalType?.length) node.additionalType = site.schema.additionalType;
  // Certificates and licenses the client has sent (site.credentials), each recognized
  // by the body that issued it. Same list as the visible "Certificates and Licenses" block.
  if (site.credentials?.length) {
    node.hasCredential = site.credentials.map((c) => ({
      '@type': 'EducationalOccupationalCredential',
      name: c.name,
      credentialCategory: c.category ?? (/licen[cs]e/i.test(c.name) ? 'license' : 'certification'),
      recognizedBy: { '@type': 'Organization', name: c.issuer, url: c.issuerUrl },
      identifier: c.number,
      url: c.verifyUrl,
    }));
  }
  // Review markup only when reviews are actually visible on the site (live widget
  // installed). Google ignores self-serving LocalBusiness stars anyway; AI answers
  // read the visible rating text.
  if (site.rating?.value && site.rating?.count && site.reviewsWidget?.id) {
    node.aggregateRating = { '@type': 'AggregateRating', ratingValue: site.rating.value, reviewCount: site.rating.count, bestRating: 5 };
  }
  return node;
}

export function websiteNode() {
  const { site } = loadContent();
  return { '@type': 'WebSite', '@id': abs('/#website'), url: abs('/'), name: site.name, publisher: { '@id': businessId() }, inLanguage: 'en-US' };
}

export function webPageNode(path, { name, description, hasBreadcrumb, dateModified, type = 'WebPage', mainEntity }) {
  return {
    '@type': type,
    '@id': abs(`${path}#webpage`),
    url: abs(path),
    name,
    description,
    inLanguage: 'en-US',
    isPartOf: { '@id': abs('/#website') },
    about: { '@id': businessId() },
    dateModified: dateModified ?? undefined,
    breadcrumb: hasBreadcrumb ? { '@id': abs(`${path}#breadcrumb`) } : undefined,
    mainEntity: mainEntity ? { '@id': mainEntity } : undefined,
  };
}

export function breadcrumbNode(path, crumbs) {
  return {
    '@type': 'BreadcrumbList',
    '@id': abs(`${path}#breadcrumb`),
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
  };
}

// Service node. `area` = { type: 'City' | 'AdministrativeArea', name } for local pages.
export function serviceNode(path, { name, serviceType, additionalType, area, brand }) {
  const node = {
    '@type': 'Service',
    '@id': abs(`${path}#service`),
    name,
    serviceType,
    url: abs(path),
    provider: { '@id': businessId() },
    areaServed: area ? { '@type': area.type, name: area.name } : loadContent().cities.map((c) => ({ '@type': 'City', name: `${c.name}, ${regionFor(c)}` })),
    brand: brand ? { '@type': 'Brand', name: brand } : undefined,
  };
  if (additionalType?.length) node.additionalType = additionalType;
  return node;
}

// Hub list: the CollectionPage's mainEntity on the services hub (team review, 3 Nov 2026).
// Each item points at the Service node of its own page by @id, so the hub and the service
// pages describe the same entities. Only live pages are listed.
export function serviceListNode(path, items) {
  if (!items?.length) return null;
  return {
    '@type': 'ItemList',
    '@id': abs(`${path}#services`),
    name: titleCase(loadContent().site.umbrellaKeyword ?? 'Services'),
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { '@type': 'Service', '@id': abs(`${it.path}#service`), name: it.name, serviceType: it.name, url: abs(it.path), provider: { '@id': businessId() } },
    })),
  };
}

export function faqNode(path, faq) {
  if (!faq?.length) return null;
  return {
    '@type': 'FAQPage',
    '@id': abs(`${path}#faq`),
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: plain(f.q), acceptedAnswer: { '@type': 'Answer', text: plain(f.a) } })),
  };
}

export function personNode(author) {
  if (!author) return null;
  return {
    '@type': 'Person',
    '@id': abs(`${routes.about()}#${author.slug}`),
    name: author.name,
    jobTitle: author.role,
    description: author.bio,
    url: abs(`${routes.about()}#${author.slug}`),
    worksFor: { '@id': businessId() },
    sameAs: author.sameAs?.length ? author.sameAs : undefined,
  };
}

export function blogPostingNode(path, post, author) {
  return {
    '@type': 'BlogPosting',
    '@id': abs(`${path}#article`),
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: author ? { '@id': abs(`${routes.about()}#${author.slug}`) } : undefined,
    publisher: { '@id': businessId() },
    mainEntityOfPage: { '@id': abs(`${path}#webpage`) },
    image: loadContent().site.ogImage ? abs(loadContent().site.ogImage) : undefined,
    about: (post.services ?? []).map((s) => ({ '@id': abs(`${routes.service(s)}#service`) })),
    inLanguage: 'en-US',
  };
}

export function graph(nodes) {
  const clean = JSON.parse(JSON.stringify(nodes.filter(Boolean)));
  return { '@context': 'https://schema.org', '@graph': clean };
}
