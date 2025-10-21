import PrefooterShader from "./prefooter-shader";
import { AnimatedHeading } from "@/components/ui/animated-heading";

export const Prefooter = () => {
  return (
    <div className="relative flex flex-col justify-center items-center min-h-[300px] md:min-h-[600px]">
      <PrefooterShader />
      <AnimatedHeading
        masked
        effectDuration={2}
        as="h3"
        className="text-2xl font-normal leading-10 tracking-[-0.03rem] -translate-y-4 text-gradient"
      >
        One framework to rule them all
      </AnimatedHeading>
    </div>
  );
};
