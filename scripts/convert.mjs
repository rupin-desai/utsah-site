/**
 * Converts the original static HTML pages in legacy/ into per-route JSON
 * payloads (content/) plus App Router page files (app/).
 *
 * The conversion is deliberately mechanical: markup is preserved verbatim,
 * only URLs are rewritten (foo.html -> /foo, assets/x -> /assets/x) and
 * <script> tags are lifted out so a client component can re-run them in the
 * original order after mount.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const legacyDir = path.join(root, 'legacy');
const contentDir = path.join(root, 'content');
const appDir = path.join(root, 'app');

// legacy file name -> route segment ('' means the home page)
const ROUTES = {
  'index.html': '',
  'index-Utsah Events Admin.html': 'admin',
  'about.html': 'about',
  'contact.html': 'contact',
  'corporate.html': 'corporate',
  'events.html': 'events',
  'live.html': 'live',
  'memories.html': 'memories',
  'privacy.html': 'privacy',
  'socials.html': 'socials',
  'team.html': 'team',
  'terms.html': 'terms',
  'wedding.html': 'wedding',
};

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

/** foo.html -> /foo, index.html -> /, keeping any #hash. */
function rewriteUrl(url) {
  const m = /^([A-Za-z0-9 _-]+)\.html(\?[^#]*)?(#.*)?$/.exec(url);
  if (!m) return url;
  const [, name, , hash = ''] = m;
  if (name === 'index') return '/' + hash;
  if (name === 'index-Utsah Events Admin') return '/admin' + hash;
  return '/' + name + hash;
}

/** Rewrite every internal link + asset path in a chunk of html or js. */
function rewritePaths(text) {
  return text
    // "about.html" / 'about.html' / "index.html#about"
    .replace(/(["'`])([A-Za-z0-9 _-]+\.html(?:#[^"'`]*)?)\1/g, (full, q, url) => q + rewriteUrl(url) + q)
    // assets/… -> /assets/…  (only when it starts a URL, never "/assets/")
    .replace(/(["'`(=])assets\//g, '$1/assets/')
    // style.css?v=85 / script.js?v=5 / cursor.js / transitions.js now live in /public
    .replace(/(["'`(=])(style|script|cursor|transitions)(-[A-Za-z0-9 _]+)?\.(css|js)/g, '$1/$2$3.$4');
}

/** Pull every <script> out of a chunk, returning the stripped html + ordered list. */
function extractScripts(html) {
  const scripts = [];
  const stripped = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (full, attrs, code) => {
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs);
    if (src) scripts.push({ src: rewritePaths(`"${decode(src[1])}"`).slice(1, -1) });
    else if (code.trim()) scripts.push({ code: rewritePaths(code) });
    return '';
  });
  return { html: stripped, scripts };
}

function convert(file, route) {
  const raw = fs.readFileSync(path.join(legacyDir, file), 'utf8');

  const head = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(raw)?.[1] ?? '';
  const body = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(raw)?.[1] ?? raw;

  const title = decode(/<title>([\s\S]*?)<\/title>/i.exec(head)?.[1]?.trim() ?? 'Utsah Events');
  const description = decode(
    /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i.exec(head)?.[1] ?? ''
  );

  // Everything from <head> that still has to reach the browser as markup:
  // font preconnects, stylesheet links and the page-scoped <style> block.
  const headExtra = [
    ...(head.match(/<link\b[^>]*>/gi) ?? []).filter((l) => !/rel=["']preload["']/i.test(l)),
    ...(head.match(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi) ?? []),
  ]
    .map(rewritePaths)
    .join('\n');

  const headScripts = extractScripts(head).scripts;
  const bodyParts = extractScripts(rewritePaths(body));

  const data = {
    title,
    description,
    headExtra,
    html: bodyParts.html,
    scripts: [...headScripts, ...bodyParts.scripts],
  };

  const name = route === '' ? 'home' : route;
  fs.writeFileSync(path.join(contentDir, `${name}.json`), JSON.stringify(data));

  const dir = route === '' ? appDir : path.join(appDir, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'page.js'),
    `import data from '@/content/${name}.json';
import LegacyPage from '@/components/LegacyPage';

export const metadata = {
  title: ${JSON.stringify(title)},
  description: ${JSON.stringify(description)},
};

export default function Page() {
  return <LegacyPage data={data} />;
}
`
  );

  return { route: route === '' ? '/' : `/${route}`, scripts: data.scripts.length, bytes: data.html.length };
}

fs.mkdirSync(contentDir, { recursive: true });
for (const [file, route] of Object.entries(ROUTES)) {
  const r = convert(file, route);
  console.log(`${r.route.padEnd(12)} ${String(r.bytes).padStart(7)} bytes  ${r.scripts} scripts`);
}
