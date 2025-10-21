import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-static";

export default async function Page() {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center gap-4">
      <h1 className="display text-center text-balance z-10 text-gradient">
        404 - Page Not Found
      </h1>
      <p className="text-center text-balance z-10 text-gradient">
        The page you are looking for does not exist.
      </p>
      <div className="flex items-center justify-center gap-2 mt-2">
        <Button variant="primary" asChild>
          <Link href="/">Go back home</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/docs">Read the docs</Link>
        </Button>
      </div>
    </div>
  );
}
