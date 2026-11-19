// Per-page breadcrumbs (visible + schema, mirroring the site tree) and JSON-LD graph.
import { loadContent, getService, getCounty, getCity, getBrand, getAuthor, isLive, titleFor, descriptionFor, h1For, updatedFor, titleCase, regionFor } from './content.mjs';
import { routes } from './routes.mjs';
import { renderPost } from './md.mjs';
import { graph, businessNode, websiteNode, webPageNode, breadcrumbNode, serviceNode, serviceListNode, faqNode, blogPostingNode, personNode } from './schema.mjs';

const HOME = { name: 'Home', path: routes.home() };
const AREA = () => ({ name: 'Service Area', path: routes.areasHub() });

function countyCrumb(countySlug) {
  const { useCountyPages } = loadContent();
  const county = getCounty(countySlug);
  return useCountyPages && county && isLive(routes.county(county.slug)) ? [{ name: county.name, path: routes.county(county.slug) }] : [];
}

export function crumbsFor(page) {
  const c = page.copy ?? {};
  const self = { name: h1For(page) ?? c.title, path: page.path };
  switch (page.type) {
    case 'home': return [HOME];
    case 'service': return [HOME, { name: 'Services', path: routes.servicesHub() }, { name: getService(page.service).name, path: page.path }];
    case 'county': return [HOME, AREA(), { name: getCounty(page.county).name, path: page.path }];
    case 'city': return [HOME, AREA(), ...countyCrumb(page.county), { name: getCity(page.city).name, path: page.path }];
    case 'city-service': {
      const city = getCity(page.city);
      return [HOME, AREA(), ...countyCrumb(page.county), { name: city.name, path: routes.city(city.slug) }, { name: getService(page.service).name, path: page.path }];
    }
    case 'brand': {
      const trail = [HOME];
      if (isLive(routes.brandsHub())) trail.push({ name: loadContent().site.brandsHub?.label ?? 'Brands We Service', path: routes.brandsHub() });
      return [...trail, { name: getBrand(page.brand).name, path: page.path }];
    }
    case 'faq':
    case 'reviews':
      return [HOME, ...(isLive(routes.about()) ? [{ name: 'About', path: routes.about() }] : []), { name: page.type === 'faq' ? 'FAQ' : 'Reviews', path: page.path }];
    case 'blog-post': return [HOME, { name: 'Blog', path: routes.blogHub() }, { name: c.title, path: page.path }];
    default: return [HOME, { ...self, name: self.name }];
  }
}

export function schemaFor(page) {
  const { site } = loadContent();
  const crumbs = crumbsFor(page);
  const hasCrumbs = crumbs.length > 1;
  const isPost = page.type === 'blog-post';
  const hubServices = page.type === 'services-hub'
    ? loadContent().services.map((s) => ({ name: s.name, path: routes.service(s.slug) })).filter((s) => loadContent().byPath.get(s.path)?.live)
    : [];
  const nodes = [
    businessNode(),
    websiteNode(),
    webPageNode(page.path, {
      name: titleFor(page),
      description: descriptionFor(page),
      hasBreadcrumb: hasCrumbs,
      dateModified: updatedFor(page),
      type: { about: 'AboutPage', contact: 'ContactPage', 'blog-hub': 'CollectionPage', 'services-hub': 'CollectionPage', 'areas-hub': 'CollectionPage' }[page.type] ?? 'WebPage',
      mainEntity: hubServices.length ? new URL(`${page.path}#services`, site.url).href : undefined,
    }),
    serviceListNode(page.path, hubServices),
  ];
  if (hasCrumbs) nodes.push(breadcrumbNode(page.path, crumbs));

  const region = site.address.region;
  const umbrella = titleCase(site.umbrellaKeyword ?? '');
  if (page.type === 'service') {
    const s = getService(page.service);
    nodes.push(serviceNode(page.path, { name: h1For(page), serviceType: s.name, additionalType: s.additionalType }));
  }
  if (page.type === 'city-service') {
    const s = getService(page.service);
    const city = getCity(page.city);
    nodes.push(serviceNode(page.path, { name: h1For(page), serviceType: s.name, additionalType: s.additionalType, area: { type: 'City', name: `${city.name}, ${regionFor(city)}` } }));
  }
  if (page.type === 'city') {
    nodes.push(serviceNode(page.path, { name: h1For(page), serviceType: umbrella, additionalType: site.schema?.additionalType, area: { type: 'City', name: `${getCity(page.city).name}, ${regionFor(getCity(page.city))}` } }));
  }
  if (page.type === 'county') {
    nodes.push(serviceNode(page.path, { name: h1For(page), serviceType: umbrella, additionalType: site.schema?.additionalType, area: { type: 'AdministrativeArea', name: `${getCounty(page.county).name}, ${getCounty(page.county).region ?? region}` } }));
  }
  if (page.type === 'brand') {
    const b = getBrand(page.brand);
    nodes.push(serviceNode(page.path, { name: h1For(page), serviceType: `${b.name} ${site.umbrellaKeyword}`, additionalType: b.additionalType, brand: b.name }));
  }

  let faq = page.copy?.faq;
  if (page.type === 'faq') faq = (page.copy.groups ?? []).flatMap((g) => g.faq ?? []);
  if (isPost) {
    const author = getAuthor(page.copy.author);
    nodes.push(blogPostingNode(page.path, page.copy, author), personNode(author));
    faq = renderPost(page.copy.body, site.url).faq;
  }
  nodes.push(faqNode(page.path, faq));
  return graph(nodes);
}
