import { cn } from "@/utils/cn";
import Link from "next/link";
import { fetchExamples, ExampleItem } from "@/utils/github";

export async function ExampleCards() {
  const examples = await fetchExamples();

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {examples.map((example: ExampleItem, index: number) => (
          <ExampleCard key={index} {...example} />
        ))}
      </section>
    </div>
  );
}

export function ExampleCard({
  className,
  ...item
}: {
  className?: string;
} & ExampleItem) {
  const { name, description, repositoryUrl, tags } = item;

  return (
    <Link
      href={repositoryUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-left group relative overflow-visible h-full min-w-[280px] block",
        className
      )}
    >
      <div className="top-1 left-1 absolute w-full h-full group-hover:border group-hover:visible invisible border-[#333]" />
      <div className="relative border p-4 group-hover:bg-black h-full min-h-[12rem] w-full flex flex-col border-[#333]">
        <div className="mb-3">
          <h3 className="italic text-white font-medium">
            {name}{" "}
            <span className="invisible group-hover:visible text-sm">{"→"}</span>
          </h3>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-3 flex flex-col justify-between h-full">
            <p className="text-sm text-[#BABABA] leading-relaxed">
              {description}
            </p>
          </div>

          {tags && tags.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 border border-white/20 text-white/80 uppercase tracking-wide">
                  {tags[0]}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
