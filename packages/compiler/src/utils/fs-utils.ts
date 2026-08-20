import fs from "fs";
import json5 from "json5";

export function createFolder(folderPath: string) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

export function parseJson<T = any>(json: string) {
  try {
    return [json5.parse(json) as T, null] as const;
  } catch (e) {
    return [null, e as Error] as const;
  }
}
