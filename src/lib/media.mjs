// Media helpers. A media item is { src, alt, width?, height?, placeholder?, credit? }.
// Remote stock URLs (Unsplash, Pexels) get resized through their CDN parameters;
// local files (/photos/...) are served as they are. `placeholder: true` marks a
// sample photo: it renders a visible "Sample photo" tag and the gate blocks it
// from a live client domain (SITE_LIVE=1).
export function sized(src = '', w = 1200) {
  if (src.includes('images.unsplash.com')) return `${src.split('?')[0]}?w=${w}&q=70&auto=format&fit=crop`;
  if (src.includes('images.pexels.com')) return `${src.split('?')[0]}?auto=compress&cs=tinysrgb&w=${w}`;
  return src;
}
export function srcset(src = '', widths = [480, 800, 1200]) {
  if (!/images\.(unsplash|pexels)\.com/.test(src)) return undefined;
  return widths.map((w) => `${sized(src, w)} ${w}w`).join(', ');
}
