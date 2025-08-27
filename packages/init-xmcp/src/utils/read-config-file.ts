import ts from "typescript";

export function readTsConfigFile<T = any>(filePath: string): T {
  const { config, error } = ts.readConfigFile(filePath, ts.sys.readFile);
  if (error) {
    throw new Error(
      `Invalid tsconfig.json → ${ts.flattenDiagnosticMessageText(error.messageText, "\n")}`
    );
  }
  return config as T;
}