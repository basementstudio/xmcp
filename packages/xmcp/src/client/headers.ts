export interface CustomHeader {
  name: string;
  value: string;
}

export type CustomHeaders = CustomHeader[];

export const createEmptyHeader = (): CustomHeader => ({
  name: "",
  value: "",
});

export const headersToRecord = (
  headers: CustomHeaders
): Record<string, string> => {
  const record: Record<string, string> = {};

  headers.forEach((header) => {
    record[header.name.trim()] = header.value.trim();
  });

  return record;
};
