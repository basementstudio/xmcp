import { Tag } from "@/components/ui/tag";
import { fetchTestimonials } from "@/basehub";
import { TestimonialsCarousel } from "./carousel";
import Image from "next/image";
import Link from "next/link";

interface TestimonialProps {
  _title: string;
  handle: string;
  tagline: string;
  position: string | null;
  logo: {
    url: string;
  } | null;
}

export async function HomeTestimonials() {
  const testimonials = (await fetchTestimonials()) as TestimonialProps[];

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
        </div>
      </div>
      <TestimonialsCarousel>
        {testimonials.map((testimonial, index) => (
          <TestimonialCard key={index} {...testimonial} />
        ))}
      </TestimonialsCarousel>
    </div>
  );
}

const TestimonialCard = ({
  _title,
  handle,
  tagline,
  position,
  logo,
}: TestimonialProps) => {
  return (
    <div className="flex h-full min-h-[220px] flex-col rounded-xs border border-brand-neutral-500 p-4 transition-colors duration-200 hover:border-brand-neutral-300 hover:bg-black">
      <p className="text-brand-neutral-50 text-sm leading-relaxed line-clamp-4 flex-1">
        &ldquo;{tagline}&rdquo;
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="w-10 h-10 min-w-10 min-h-10 rounded-lg border-2 border-brand-neutral-500 overflow-hidden bg-brand-black">
          {logo ? (
            <Image
              src={logo.url}
              alt={_title}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        <div className="flex flex-col">
          <Link
            href={`https://x.com/${handle.replace(/^@/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-white text-sm font-medium hover:text-brand-neutral-100 transition-colors"
          >
            {handle.startsWith("@") ? handle : `@${handle}`}
          </Link>
          {position && (
            <span className="text-brand-neutral-200 text-xs">{position}</span>
          )}
        </div>
      </div>
    </div>
  );
};
