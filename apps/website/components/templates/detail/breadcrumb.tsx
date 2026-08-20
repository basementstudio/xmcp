import Link from "next/link";
import { Icons } from "@/components/icons";

export function TemplateBreadcrumb({ name }: { name: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="text-sm text-brand-neutral-200 mb-2"
    >
      <ol className="flex items-center gap-1">
        <li className="flex items-center gap-1">
          <Link
            href="/templates"
            className="hover:text-brand-white text-brand-neutral-100"
          >
            Templates
          </Link>
          <span className="text-brand-neutral-100">
            <Icons.arrowDown className="w-4 h-4 -rotate-90" />
          </span>
        </li>
        <li aria-current="page" className="text-brand-white capitalize">
          {name}
        </li>
      </ol>
    </nav>
  );
}
