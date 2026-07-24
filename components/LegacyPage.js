import LegacyScripts from './LegacyScripts';

/**
 * Renders one converted page: the original <head> links/styles followed by the
 * original body markup, verbatim. `display: contents` keeps the wrapper out of
 * the layout so the markup behaves exactly as it did as a direct child of body.
 */
export default function LegacyPage({ data }) {
  return (
    <>
      <div
        style={{ display: 'contents' }}
        dangerouslySetInnerHTML={{ __html: data.headExtra + data.html }}
      />
      <LegacyScripts scripts={data.scripts} />
    </>
  );
}
