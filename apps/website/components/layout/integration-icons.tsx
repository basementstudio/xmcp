import Image from "next/image";

type IconProps = { className?: string; id?: string };

// Keep official artwork intact; monochrome marks use the supplied theme variants.
function BrandIcon({
  src,
  darkSrc,
  className,
  id,
}: IconProps & { src: string; darkSrc?: string }) {
  return (
    <span
      id={id}
      className={`site-icon inline-flex ${className ?? ""}`}
      aria-hidden="true"
    >
      <Image
        src={src}
        alt=""
        width={15}
        height={15}
        unoptimized
        className={`object-contain ${darkSrc ? "dark:hidden" : ""}`}
      />
      {darkSrc && (
        <Image
          src={darkSrc}
          alt=""
          width={15}
          height={15}
          unoptimized
          className="hidden object-contain dark:block"
        />
      )}
    </span>
  );
}

export const IntegrationIcons = {
  resend: (props: IconProps) => (
    <BrandIcon
      {...props}
      src="/integrations/resend-black.svg"
      darkSrc="/integrations/resend-white.svg"
    />
  ),
  paper: (props: IconProps) => (
    <BrandIcon {...props} src="/integrations/paper.png" />
  ),
  figma: (props: IconProps) => (
    <BrandIcon {...props} src="/integrations/figma.svg" />
  ),
  profound: (props: IconProps) => (
    <BrandIcon
      {...props}
      src="/integrations/profound-dark.svg"
      darkSrc="/integrations/profound-light.svg"
    />
  ),
};
