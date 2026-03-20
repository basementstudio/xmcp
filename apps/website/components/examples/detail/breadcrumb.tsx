import Link from "next/link";
import { Icons } from "@/components/icons";

export function ExampleBreadcrumb({ name }: { name: string }) {
  return (
    <div className="text-sm text-brand-neutral-200 flex items-center gap-1 mb-2">
      <Link
        href="/examples"
        className="hover:text-brand-white text-brand-neutral-100"
      >
        Templates
      </Link>
      <span className="text-brand-neutral-100">
        <Icons.arrowDown className="w-4 h-4 -rotate-90" />
      </span>
      <span className="text-brand-white capitalize">{name}</span>
    </div>
  );
}
