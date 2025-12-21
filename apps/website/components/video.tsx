interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  aspectRatio?: string;
}

export function Video({ src, aspectRatio = "16/9", ...props }: VideoProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{ aspectRatio }}
    >
      <video
        src={src}
        className="absolute inset-0 h-full w-full object-cover"
        {...props}
      />
    </div>
  );
}

