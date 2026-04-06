import {
  ElicitRequestFormParamsSchema,
  ElicitRequestURLParamsSchema,
  ElicitResultSchema,
} from "@modelcontextprotocol/sdk/types";
import type {
  ElicitFormField,
  ElicitFormRequest,
  ElicitRequest,
  ElicitResult,
  ElicitUrlRequest,
  ToolExtraArguments,
  ToolRequestOptions,
} from "@/types/tool";

type ElicitRequestSender = Pick<ToolExtraArguments, "sendRequest">;

const ALLOWED_FORM_REQUEST_KEYS = new Set(["message", "mode", "requestedSchema"]);
const ALLOWED_URL_REQUEST_KEYS = new Set([
  "elicitationId",
  "message",
  "mode",
  "url",
]);
const ALLOWED_FORM_SCHEMA_KEYS = new Set(["properties", "required", "type"]);
const ALLOWED_STRING_FIELD_KEYS = new Set([
  "default",
  "description",
  "format",
  "maxLength",
  "minLength",
  "title",
  "type",
]);
const ALLOWED_ENUM_FIELD_KEYS = new Set([
  "default",
  "description",
  "enum",
  "enumNames",
  "title",
  "type",
]);
const ALLOWED_BOOLEAN_FIELD_KEYS = new Set([
  "default",
  "description",
  "title",
  "type",
]);
const ALLOWED_NUMBER_FIELD_KEYS = new Set([
  "default",
  "description",
  "maximum",
  "minimum",
  "title",
  "type",
]);
const ALLOWED_STRING_FORMATS = new Set(["date", "date-time", "email", "uri"]);

export async function elicitFromTool(
  extra: ElicitRequestSender,
  request: ElicitRequest,
  options?: ToolRequestOptions
): Promise<ElicitResult> {
  const params = normalizeElicitationRequest(request);
  const result = await extra.sendRequest(
    { method: "elicitation/create", params },
    ElicitResultSchema,
    options
  );

  return {
    ...result,
    content: result.content ?? undefined,
  };
}

function normalizeElicitationRequest(request: ElicitRequest) {
  const mode = request.mode ?? "form";

  if (mode === "url") {
    assertValidUrlRequest(request);
    return ElicitRequestURLParamsSchema.parse(request);
  }

  if (mode !== "form") {
    throw new Error(
      `Unsupported elicitation mode "${String((request as { mode?: unknown }).mode)}". Expected "form" or "url".`
    );
  }

  assertValidFormRequest(request);
  return ElicitRequestFormParamsSchema.parse({
    ...request,
    mode: "form",
  });
}

function assertValidFormRequest(
  request: ElicitRequest
): asserts request is ElicitFormRequest {
  assertPlainObject(request, "Elicitation request must be a plain object.");
  assertAllowedKeys(request, ALLOWED_FORM_REQUEST_KEYS, "Form elicitation");
  assertString(request.message, "Form elicitation requires a string message.");

  const requestedSchema = request.requestedSchema;
  assertPlainObject(
    requestedSchema,
    "Form elicitation requires a flat object schema."
  );
  assertAllowedKeys(
    requestedSchema,
    ALLOWED_FORM_SCHEMA_KEYS,
    "Form elicitation schema"
  );

  if (requestedSchema.type !== "object") {
    throw new Error('Form elicitation schema must use type "object".');
  }

  assertPlainObject(
    requestedSchema.properties,
    "Form elicitation schema requires a properties object."
  );

  for (const [fieldName, field] of Object.entries(requestedSchema.properties)) {
    assertSupportedFormField(fieldName, field);
  }

  if (typeof requestedSchema.required === "undefined") {
    return;
  }

  if (
    !Array.isArray(requestedSchema.required) ||
    requestedSchema.required.some((fieldName) => typeof fieldName !== "string")
  ) {
    throw new Error(
      "Form elicitation schema required fields must be a string array."
    );
  }

  for (const fieldName of requestedSchema.required) {
    if (!(fieldName in requestedSchema.properties)) {
      throw new Error(
        `Form elicitation schema required field "${fieldName}" is not defined in properties.`
      );
    }
  }
}

function assertValidUrlRequest(
  request: ElicitRequest
): asserts request is ElicitUrlRequest {
  assertPlainObject(request, "Elicitation request must be a plain object.");
  assertAllowedKeys(request, ALLOWED_URL_REQUEST_KEYS, "URL elicitation");
  assertString(request.message, "URL elicitation requires a string message.");
  assertNonEmptyString(
    request.elicitationId,
    "URL elicitation requires a non-empty elicitationId."
  );
  assertNonEmptyString(request.url, "URL elicitation requires a non-empty URL.");

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(request.url);
  } catch {
    throw new Error("URL elicitation requires a valid http or https URL.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("URL elicitation requires a valid http or https URL.");
  }
}

function assertSupportedFormField(
  fieldName: string,
  field: unknown
): asserts field is ElicitFormField {
  assertPlainObject(
    field,
    `Form elicitation field "${fieldName}" must be a plain object.`
  );
  assertOptionalString(
    field.title,
    `Form elicitation field "${fieldName}" title must be a string.`
  );
  assertOptionalString(
    field.description,
    `Form elicitation field "${fieldName}" description must be a string.`
  );

  if (field.type === "string" && "enum" in field) {
    assertAllowedKeys(
      field,
      ALLOWED_ENUM_FIELD_KEYS,
      `Form elicitation field "${fieldName}"`
    );
    assertStringArray(
      field.enum,
      `Form elicitation field "${fieldName}" enum values must be strings.`
    );
    assertOptionalStringArray(
      field.enumNames,
      `Form elicitation field "${fieldName}" enumNames must be strings.`
    );

    if (
      typeof field.enumNames !== "undefined" &&
      field.enumNames.length !== field.enum.length
    ) {
      throw new Error(
        `Form elicitation field "${fieldName}" enumNames length must match enum length.`
      );
    }

    assertOptionalString(
      field.default,
      `Form elicitation field "${fieldName}" default must be a string.`
    );

    if (
      typeof field.default !== "undefined" &&
      !field.enum.includes(field.default)
    ) {
      throw new Error(
        `Form elicitation field "${fieldName}" default must be one of its enum values.`
      );
    }

    return;
  }

  if (field.type === "string" && !("enum" in field)) {
    assertAllowedKeys(
      field,
      ALLOWED_STRING_FIELD_KEYS,
      `Form elicitation field "${fieldName}"`
    );
    assertOptionalNumber(
      field.minLength,
      `Form elicitation field "${fieldName}" minLength must be a number.`
    );
    assertOptionalNumber(
      field.maxLength,
      `Form elicitation field "${fieldName}" maxLength must be a number.`
    );
    assertOptionalString(
      field.default,
      `Form elicitation field "${fieldName}" default must be a string.`
    );

    const format = field.format;
    assertOptionalString(
      format,
      `Form elicitation field "${fieldName}" format must be a string.`
    );

    if (typeof format !== "undefined" && !ALLOWED_STRING_FORMATS.has(format)) {
      throw new Error(
        `Form elicitation field "${fieldName}" format must be one of: ${Array.from(ALLOWED_STRING_FORMATS).join(", ")}.`
      );
    }

    return;
  }

  if (field.type === "boolean") {
    assertAllowedKeys(
      field,
      ALLOWED_BOOLEAN_FIELD_KEYS,
      `Form elicitation field "${fieldName}"`
    );

    if (
      typeof field.default !== "undefined" &&
      typeof field.default !== "boolean"
    ) {
      throw new Error(
        `Form elicitation field "${fieldName}" default must be a boolean.`
      );
    }

    return;
  }

  if (field.type === "number" || field.type === "integer") {
    assertAllowedKeys(
      field,
      ALLOWED_NUMBER_FIELD_KEYS,
      `Form elicitation field "${fieldName}"`
    );
    assertOptionalNumber(
      field.minimum,
      `Form elicitation field "${fieldName}" minimum must be a number.`
    );
    assertOptionalNumber(
      field.maximum,
      `Form elicitation field "${fieldName}" maximum must be a number.`
    );
    assertOptionalNumber(
      field.default,
      `Form elicitation field "${fieldName}" default must be a number.`
    );

    return;
  }

  throw new Error(
    `Form elicitation field "${fieldName}" uses unsupported type "${String((field as { type?: unknown }).type)}". Supported types are string, boolean, number, integer, and string enums.`
  );
}

function assertAllowedKeys(
  value: Record<string, unknown>,
  allowedKeys: Set<string>,
  label: string
): void {
  const extraKeys = Object.keys(value).filter((key) => !allowedKeys.has(key));

  if (extraKeys.length === 0) {
    return;
  }

  throw new Error(
    `${label} includes unsupported key(s): ${extraKeys.join(", ")}.`
  );
}

function assertPlainObject(
  value: unknown,
  errorMessage: string
): asserts value is Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(errorMessage);
  }
}

function assertString(
  value: unknown,
  errorMessage: string
): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(errorMessage);
  }
}

function assertNonEmptyString(
  value: unknown,
  errorMessage: string
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(errorMessage);
  }
}

function assertOptionalString(
  value: unknown,
  errorMessage: string
): asserts value is string | undefined {
  if (typeof value !== "undefined" && typeof value !== "string") {
    throw new Error(errorMessage);
  }
}

function assertOptionalNumber(
  value: unknown,
  errorMessage: string
): asserts value is number | undefined {
  if (typeof value !== "undefined" && typeof value !== "number") {
    throw new Error(errorMessage);
  }
}

function assertStringArray(
  value: unknown,
  errorMessage: string
): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(errorMessage);
  }
}

function assertOptionalStringArray(
  value: unknown,
  errorMessage: string
): asserts value is string[] | undefined {
  if (typeof value === "undefined") {
    return;
  }

  assertStringArray(value, errorMessage);
}
