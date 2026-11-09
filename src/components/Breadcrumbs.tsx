import Link from 'next/link';

/** trail: [label, href?] pairs after Home. The last item is the current page. */
export function Breadcrumbs({ trail }: { trail: [string, string?][] }) {
  const items: [string, string?][] = [['Home', '/'], ...trail];
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol className="wrap flex flex-wrap py-2.5">
        {items.map(([label, href], i) => (
          <li key={i}>
            {i > 0 && (
              <span className="sep" aria-hidden="true">
                ›
              </span>
            )}
            {href && i < items.length - 1 ? <Link href={href}>{label}</Link> : <span aria-current="page">{label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
