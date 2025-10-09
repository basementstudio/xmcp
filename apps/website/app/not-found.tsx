import { XmcpLogo } from "../components/terminal/logo";

export const dynamic = "force-static";

export default async function Page() {
  return (
    <div className="min-h-[calc(100vh-12rem)]">
      <div className="absolute inset-x-0 inset-y-[20vh] md:inset-y-0 m-auto">
        <XmcpLogo />
      </div>
    </div>
  );
}
