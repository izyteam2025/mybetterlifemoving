// Main menu and footer, built from the registry (client-site-mapping house pattern):
// header doors by buyer question, no "Home" item (the logo links home), every
// dropdown parent is a real hub page, Service Area lists every city alphabetically,
// one CTA button. Only live pages appear.

import { loadContent, liveHref, isLive, ctaPath, ctaLabel, cityHref } from './content.mjs';
import { routes } from './routes.mjs';

export function mainNav() {
  const { services, cities, brands, site } = loadContent();
  const items = [];
  const kids = (list) => list.filter((k) => k.href);

  if (isLive(routes.servicesHub())) {
    const groups = serviceGroups(services, site);
    items.push({ label: 'Services', href: routes.servicesHub(), children: kids(services.map((s) => ({ label: s.navLabel ?? s.name, href: liveHref(routes.service(s.slug)) }))), groups, groupLinks: groups ? kids((site.serviceGroupLinks ?? []).map((x) => ({ label: x.label, href: liveHref(x.href) }))) : [] });
  }
  if (isLive(routes.areasHub())) {
    items.push({ label: 'Service Area', href: routes.areasHub(), children: kids(cities.map((c) => ({ label: c.name, href: cityHref(c) }))) });
  }
  if (brands.length && isLive(routes.brandsHub())) {
    items.push({ label: site.brandsHub?.label ?? 'Brands We Service', href: routes.brandsHub(), children: kids(brands.map((b) => ({ label: b.name, href: liveHref(routes.brand(b.slug)) }))) });
  }
  // Client-specific top-level items from site.json (e.g. a membership page), in
  // the order given, before About. Only live pages appear.
  for (const x of site.navExtra ?? []) if (isLive(x.href)) items.push({ label: x.label, href: x.href, children: [] });
  if (isLive(routes.about())) {
    // Blog sits in the About dropdown (team review, 3 Nov 2026): it keeps the top bar to the
    // money pages. With no About page it falls back to a top-level item.
    items.push({ label: 'About', href: routes.about(), children: kids([{ label: 'FAQ', href: liveHref(routes.faq()) }, { label: 'Reviews', href: liveHref(routes.reviews()) }, { label: 'Blog', href: liveHref(routes.blogHub()) }]) });
  } else if (isLive(routes.blogHub())) items.push({ label: 'Blog', href: routes.blogHub(), children: [] });
  if (isLive(routes.contact())) items.push({ label: 'Contact', href: routes.contact(), children: [] });
  return { items, cta: { label: ctaLabel(), href: ctaPath() } };
}

// Services menu in columns by appliance family (site.serviceGroups: [{ label, services: [slug] }]).
// Short menu labels come from services.json navLabel; a service left out of every group lands
// in a last "More Services" column, so nothing disappears. No groups: the flat list as before.
export function serviceGroups(services, site) {
  if (!site.serviceGroups?.length) return null;
  const bySlug = new Map(services.map((s) => [s.slug, s]));
  const used = new Set();
  const link = (s) => ({ label: s.navLabel ?? s.name, href: liveHref(routes.service(s.slug)) });
  const groups = site.serviceGroups.map((g) => ({
    label: g.label,
    links: g.services.map((slug) => bySlug.get(slug)).filter(Boolean).map((s) => (used.add(s.slug), link(s))).filter((x) => x.href),
  }));
  // A service linked under the columns (site.serviceGroupLinks, e.g. same-day repair) is not repeated in "More Services".
  const linked = new Set((site.serviceGroupLinks ?? []).map((x) => x.href));
  const rest = services.filter((s) => !used.has(s.slug) && !linked.has(routes.service(s.slug))).map(link).filter((x) => x.href);
  if (rest.length) groups.push({ label: 'More Services', links: rest });
  return groups.filter((g) => g.links.length);
}

export function footerNav() {
  const { services, cities, site } = loadContent();
  // Footer: only the services flagged footer: true in services.json (all of them when none is
  // flagged), plus a link to the services hub, so the column stays short.
  const flagged = services.filter((s) => s.footer);
  const footerServices = (flagged.length ? flagged : services).map((s) => ({ label: s.name, href: liveHref(routes.service(s.slug)) })).filter((x) => x.href);
  if (flagged.length && isLive(routes.servicesHub())) footerServices.push({ label: 'All Services', href: routes.servicesHub() });
  return {
    services: footerServices,
    cities: cities.map((c) => ({ label: c.name, href: cityHref(c) })).filter((x) => x.href),
    more: [
      ...(site.navExtra ?? []).map((x) => ({ label: x.label, href: liveHref(x.href) })),
      { label: 'About', href: liveHref(routes.about()) },
      { label: 'Reviews', href: liveHref(routes.reviews()) },
      { label: 'Contact', href: liveHref(routes.contact()) },
      { label: 'Blog', href: liveHref(routes.blogHub()) },
      { label: 'Privacy Policy', href: liveHref(routes.page('privacy-policy')) },
      { label: 'Terms of Service', href: liveHref(routes.page('terms-of-service')) },
    ].filter((x) => x.href),
  };
}
