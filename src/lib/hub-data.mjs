// Shared lists for the two hubs: every live main service page, and every live
// main city page (grouped under county cards when the site has county pages).
import { loadContent, liveHref, citiesInCounty, citiesTargetFirst, cityHref } from './content.mjs';
import { routes } from './routes.mjs';

export function serviceCardsAll(overrides = {}) {
  return loadContent().services
    .map((s) => ({ title: s.name, text: overrides?.[s.slug] ?? s.summary, href: liveHref(routes.service(s.slug)), image: s.image }))
    .filter((x) => x.href);
}

export function locationBlock() {
  const { counties, useCountyPages } = loadContent();
  if (useCountyPages) {
    return {
      items: [],
      groups: counties.map((co) => ({
        name: co.name,
        href: liveHref(routes.county(co.slug)),
        items: citiesInCounty(co.slug).map((ci) => ({ label: ci.name, href: cityHref(ci) })),
      })).filter((g) => g.href || g.items.some((i) => i.href)),
    };
  }
  return { items: citiesTargetFirst().map((ci) => ({ label: ci.name, href: cityHref(ci) })), groups: null };
}
