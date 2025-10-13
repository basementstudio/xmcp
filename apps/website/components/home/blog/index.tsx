import { Tag } from "@/components/ui/tag";

export const HomeBlog = () => {
  return (
    <div className="col-span-12 grid grid-cols-12 gap-[20px] py-8 md:py-16">
      <div className="flex flex-col items-start justify-center col-span-12 lg:col-span-9 lg:col-start-2 w-full mx-auto mb-8 gap-3">
        <Tag text="Blog" />
        <div className="grid grid-cols-12 lg:grid-cols-9 gap-4 md:gap-8 w-full">
          <h2 className="heading-2 text-balance col-span-12 lg:col-span-4 mt-auto">
            Guides & changelogs
          </h2>
          <p className="text-brand-neutral-100 text-base col-span-12 max-w-[650px] lg:col-span-5 mt-auto">
            Learn, build, and stay up to date with the latest guides,
            changelogs, and insights to make the most of your MCP server.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[20px] col-span-12"></div>
    </div>
  );
};
