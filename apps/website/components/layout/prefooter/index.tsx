import BgImg from "./x.png";
import Image from "next/image";

export const Prefooter = () => {
  return (
    <div className="relative flex flex-col justify-center items-center min-h-[300px] md:min-h-[600px]">
      <Image src={BgImg} alt="Prefooter" width={127} height={154} />
      <h3 className="text-2xl font-normal leading-10 tracking-[-0.03rem] -translate-y-4 text-gradient">
        One framework to rule them all
      </h3>
    </div>
  );
};
