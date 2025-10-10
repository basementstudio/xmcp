export interface ResourceMetadata {
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
  size?: number;
  [key: string]: any;
}
