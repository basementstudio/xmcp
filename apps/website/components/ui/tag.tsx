export const Tag = ({ text }: { text: string }) => {
  return (
    <div className="py-1 px-2 bg-brand-neutral-600 text-[0.625rem] md:text-xs uppercase border border-dashed border-brand-neutral-400 text-brand-neutral-100">
      {text}
    </div>
  );
};
