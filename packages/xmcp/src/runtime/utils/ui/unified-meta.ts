const OPENAI_MIRRORED_KEYS = [
  "toolInvocation",
  "widgetAccessible",
  "outputTemplate",
  "widgetDescription",
  "widgetPrefersBorder",
  "widgetCSP",
  "widgetDomain",
  "widgetState",
  "resultCanProduceWidget",
] as const;

type MetadataRecord = Record<string, any>;

function cloneMetadataValue<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

function mergeLegacyOpenAIMetadata(meta: MetadataRecord): void {
  const legacyOpenai =
    meta.openai && typeof meta.openai === "object" && meta.openai !== null
      ? (meta.openai as MetadataRecord)
      : undefined;

  if (!legacyOpenai) {
    return;
  }

  if (!meta.ui || typeof meta.ui !== "object" || meta.ui === null) {
    meta.ui = cloneMetadataValue(legacyOpenai);
    return;
  }

  meta.ui = {
    ...cloneMetadataValue(legacyOpenai),
    ...(meta.ui as MetadataRecord),
  };
}

/**
 * Ensures `_meta.ui` is the canonical representation while mirroring
 * OpenAI-specific fields back onto `_meta.openai` for backwards compatibility.
 */
export function normalizeUnifiedUIMetadata(meta?: MetadataRecord): void {
  if (!meta || typeof meta !== "object") {
    return;
  }

  mergeLegacyOpenAIMetadata(meta);

  if (!meta.ui || typeof meta.ui !== "object" || meta.ui === null) {
    delete meta.openai;
    return;
  }

  const uiMeta = meta.ui as MetadataRecord;
  const openaiMeta: MetadataRecord =
    meta.openai && typeof meta.openai === "object" && meta.openai !== null
      ? cloneMetadataValue(meta.openai as MetadataRecord)
      : {};

  for (const key of OPENAI_MIRRORED_KEYS) {
    if (key in uiMeta && uiMeta[key] !== undefined) {
      openaiMeta[key] = cloneMetadataValue(uiMeta[key]);
    }
  }

  if (
    typeof uiMeta.resourceUri === "string" &&
    openaiMeta.outputTemplate === undefined
  ) {
    openaiMeta.outputTemplate = uiMeta.resourceUri;
  }

  if (Object.keys(openaiMeta).length > 0) {
    meta.openai = openaiMeta;
  } else {
    delete meta.openai;
  }
}
