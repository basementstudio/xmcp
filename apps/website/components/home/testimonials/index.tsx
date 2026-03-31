import { Tag } from "@/components/ui/tag";
import Image from "next/image";

interface TestimonialProps {
  quote: string;
  name: string;
  handle: string;
  avatar: string;
}

const testimonials: TestimonialProps[] = [
  {
    quote:
      "xmcp made it incredibly easy to get our MCP server up and running. The file-based routing is a game changer.",
    name: "Alex Rivera",
    handle: "@arivera_dev",
    avatar: "/testimonials/avatar-1.jpg",
  },
  {
    quote:
      "We migrated from a custom setup to xmcp in a day. The middleware system and auth integration saved us weeks of work.",
    name: "Sarah Chen",
    handle: "@sarahchen_ai",
    avatar: "/testimonials/avatar-2.jpg",
  },
  {
    quote:
      "The TypeScript-first approach and extensible config make xmcp the best framework for building production MCP servers.",
    name: "Marcus Johnson",
    handle: "@marcusj",
    avatar: "/testimonials/avatar-3.jpg",
  },
];

export const HomeTestimonials = () => {
  return (
    <div className="col-span-12 grid grid-cols-12 gap-[20px] py-8 md:py-16">
      <div className="flex flex-col items-start justify-center col-span-12 lg:col-span-9 lg:col-start-2 w-full mx-auto mb-8 gap-3">
        <div className="grid grid-cols-12 lg:grid-cols-9 gap-2 lg:gap-8 w-full">
          <div className="flex flex-col gap-3 col-span-12 lg:col-span-4">
            <Tag text="Testimonials" className="w-fit" />
            <h2 className="heading-2 text-balance mt-auto text-gradient">
              Loved by developers
            </h2>
          </div>
          <p className="text-brand-neutral-100 text-base col-span-12 max-w-[650px] lg:col-span-5 mt-auto">
            See what developers are saying about building with xmcp.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[20px] col-span-12">
        {testimonials.map((testimonial, index) => (
          <TestimonialCard key={index} {...testimonial} />
        ))}
      </div>
    </div>
  );
};

const TestimonialCard = ({ quote, name, handle, avatar }: TestimonialProps) => {
  return (
    <div className="flex flex-col p-4 rounded-xs border border-brand-neutral-500 hover:bg-black hover:border-brand-neutral-300 transition-colors duration-200 h-full">
      <p className="text-brand-neutral-50 text-sm leading-relaxed line-clamp-4 flex-1">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Image
          src={avatar}
          alt={name}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <span className="text-brand-white text-sm font-medium">{name}</span>
          <span className="text-brand-neutral-200 text-xs">{handle}</span>
        </div>
      </div>
    </div>
  );
};
