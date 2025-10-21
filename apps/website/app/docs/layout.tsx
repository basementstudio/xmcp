import { source } from "../../lib/source";
import { baseOptions } from "../../lib/layout.shared";
import { DocsLayout } from "@/components/layout/docs";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout tree={source.pageTree} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
