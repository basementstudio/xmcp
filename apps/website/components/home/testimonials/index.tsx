import { Tag } from "@/components/ui/tag";
import { fetchTestimonials } from "@/basehub";
import { TestimonialsCarousel } from "./carousel";
import Image from "next/image";

interface TestimonialProps {
  _title: string;
  handle: string;
  tagline: string;
  logo: {
    url: string;
  } | null;
}

export async function HomeTestimonials() {
  const testimonials = await fetchTestimonials();

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
      <TestimonialsCarousel>
        {testimonials.map((testimonial, index) => (
          <TestimonialCard key={index} {...(testimonial as TestimonialProps)} />
        ))}
      </TestimonialsCarousel>
    </div>
  );
}

const TestimonialCard = ({ _title, handle, tagline, logo }: TestimonialProps) => {
  return (
    <div className="flex flex-col p-4 rounded-xs border border-brand-neutral-500 hover:bg-black hover:border-brand-neutral-300 transition-colors duration-200 w-[calc(50%-10px)] min-w-[300px] flex-shrink-0 snap-start">
      <p className="text-brand-neutral-50 text-sm leading-relaxed line-clamp-4 flex-1">
        &ldquo;{tagline}&rdquo;
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="w-8 h-8 min-w-8 min-h-8 rounded-lg border-2 border-brand-neutral-500 overflow-hidden bg-brand-black flex items-center justify-center">
          {logo ? (
            <Image
              src={logo.url}
              alt={_title}
              width={24}
              height={24}
              className="w-5 h-5 object-contain"
            />
          ) : null}
        </div>
        <a
          href={`https://x.com/${handle.replace(/^@/, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-white text-sm font-medium hover:text-brand-neutral-100 transition-colors"
        >
          {handle.startsWith("@") ? handle : `@${handle}`}
        </a>
      </div>
    </div>
  );
};
