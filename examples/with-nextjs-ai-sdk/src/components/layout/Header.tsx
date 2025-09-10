interface HeaderProps {
  tools: string[];
}

/**
 * Header component, shows tool usage
 */
export default function Header({ tools }: HeaderProps) {
  return (
    <div className="flex-shrink-0 border-b border-gray-600 p-4">
      <div className="flex flex-row justify-between">
        <h1 className="text-xl font-semibold">xmcp / ai sdk</h1>
        <div className="flex flex-row">
          Tools used:
          {tools.map((t) => (
            <div key={t} className="text-cyan-600">
              &nbsp;{t.replace("tool-", "")}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
