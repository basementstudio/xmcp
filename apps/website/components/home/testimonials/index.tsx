import { getTestimonials, type Testimonial } from "@/utils/content";
import { TestimonialsCarousel } from "./carousel";
import Image from "next/image";
import Link from "next/link";

export function HomeTestimonials() {
  const testimonials = getTestimonials();

  return (
    <div id="community" className="editorial-section home-testimonials">
      <div className="editorial-section-head">
        <h2>Built with xmcp</h2>
        <span aria-hidden="true">IV</span>
      </div>
      <TestimonialsCarousel>
        {testimonials.map((testimonial) => (
          <TestimonialCard key={testimonial.slug} {...testimonial} />
        ))}
      </TestimonialsCarousel>
    </div>
  );
}

const TestimonialCard = ({
  name,
  handle,
  tagline,
  position,
  logo,
}: Testimonial) => {
  return (
    <div className="flex h-full min-h-[220px] flex-col rounded-lg border border-brand-neutral-500 p-4 transition-colors duration-200 hover:border-brand-neutral-300 hover:bg-black">
      <p className="text-brand-neutral-50 text-sm leading-relaxed line-clamp-4 flex-1">
        &ldquo;{tagline}&rdquo;
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="w-10 h-10 min-w-10 min-h-10 rounded-lg border-2 border-brand-neutral-500 overflow-hidden bg-brand-black">
          {logo ? (
            <Image
              src={logo}
              alt={name}
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
