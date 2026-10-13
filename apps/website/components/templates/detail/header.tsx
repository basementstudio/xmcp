import Link from "next/link";
import type { DeployOption } from "@/components/templates/deploy-dropdown";
import {
  DeployDropdown,
  ReplitMarkIcon,
} from "@/components/templates/deploy-dropdown";
import { Button } from "@/components/ui/button";

export function TemplateDetailHeader({
  name,
  description,
  demoUrl,
  replitUrl,
  deployOptions,
}: {
  name: string;
  description: string;
  demoUrl?: string;
  replitUrl?: string;
  deployOptions: DeployOption[];
}) {
  return (
    <header className="flex flex-col gap-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="heading-1 text-gradient capitalize">{name}</h1>
          {deployOptions.length > 0 && (
            <div className="lg:hidden shrink-0">
              <DeployDropdown options={deployOptions} variant="primary" />
            </div>
          )}
        </div>
        <p className="text-brand-neutral-100 text-base max-w-2xl">
          {description}
        </p>
      </div>

      <div className="flex w-full flex-wrap items-center gap-3">
        {deployOptions.length > 0 && (
          <div className="hidden lg:block">
            <DeployDropdown options={deployOptions} variant="primary" />
          </div>
        )}
        {replitUrl && (
          <Button asChild variant="secondary" size="sm" className="px-6">
            <Link href={replitUrl} target="_blank" rel="noopener noreferrer">
              <ReplitMarkIcon className="size-3.5" />
              <span>Remix</span>
            </Link>
          </Button>
        )}
        {demoUrl && (
          <Button asChild variant="secondary" size="sm" className="px-6">
            <Link href={demoUrl} target="_blank" rel="noopener noreferrer">
              View Demo
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
