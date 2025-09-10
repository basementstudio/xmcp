import { ChatStatus } from "@/types/chat";

interface LoaderProps {
  status: ChatStatus;
}

export default function Loader({ status }: LoaderProps) {
  return (
    <>
      {(status === "submitted" || status === "streaming") && (
        <div className="flex justify-start">
          <div className="p-3 max-w-xs sm:max-w-md">
            <span className="text-md">Thinking...</span>
          </div>
        </div>
      )}
    </>
  );
}
