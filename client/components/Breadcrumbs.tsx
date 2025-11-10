import Link from "next/link";

export default function Breadcrumbs({ trail }:{ trail: {name: string, href?: string}[] }){
  return (
    <div className="container-narrow mt-6">
      <nav className="text-sm text-gray-500">
        <ul className="flex items-center flex-wrap gap-1">
          {trail.map((t, idx) => (
            <li key={idx} className="flex items-center gap-1">
              {t.href ? <Link className="hover:text-primary" href={t.href}>{t.name}</Link> : <span>{t.name}</span>}
              {idx < trail.length - 1 && <span>/</span>}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
