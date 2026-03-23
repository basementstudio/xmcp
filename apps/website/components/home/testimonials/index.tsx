import { Tag } from "../../ui/tag";

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
            Hear from the developers and teams building with xmcp every day.
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

interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  company?: string;
  avatar: string;
}

const TestimonialCard = ({
  quote,
  name,
  role,
  company,
  avatar,
}: TestimonialProps) => {
  return (
    <div className="flex flex-col p-4 rounded-xs border border-brand-neutral-500 hover:bg-black hover:border-brand-neutral-300 transition-colors duration-200 h-full">
      <p className="text-brand-neutral-50 text-sm leading-relaxed line-clamp-4 flex-1">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-4 pt-4 border-t border-brand-neutral-500 flex items-center gap-3 text-[1.1rem] leading-none text-white/70">
        <span
          role="img"
          aria-label={name}
          className="h-6 w-6 shrink-0 rounded-sm bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${avatar}")` }}
        />
        <span className="text-white/55">{name}</span>
        <span className="text-white/85">
          {role}
          {company && `, ${company}`}
        </span>
      </div>
    </div>
  );
};

const testimonials: TestimonialProps[] = [
  {
    quote:
      "xmcp made it incredibly easy to spin up an MCP server. File-system routing and built-in auth saved us weeks of work.",
    name: "Alex Rivera",
    role: "Senior Engineer",
    company: "Acme AI",
    avatar: "/testimonials/alex-rivera.svg",
  },
  {
    quote:
      "The middleware system is exactly what we needed. We plugged in logging and rate limiting in minutes, not days.",
    name: "Priya Sharma",
    role: "Tech Lead",
    company: "NovaCorp",
    avatar: "/testimonials/priya-sharma.svg",
  },
  {
    quote:
      "I went from zero to a fully deployed MCP server in under an hour. The DX is unmatched for this kind of tooling.",
    name: "Jordan Kim",
    role: "Indie Developer",
    avatar: "/testimonials/jordan-kim.svg",
  },
];
