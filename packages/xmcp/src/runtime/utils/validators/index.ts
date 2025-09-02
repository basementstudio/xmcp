export type ContentValidator = (content: any) => {
  valid: boolean;
  error?: string;
};

export const contentValidators: Record<string, ContentValidator> = {
  text: (content) => {
    if (typeof content.text !== "string") {
      return {
        valid: false,
        error: 'Text content must have a "text" property of type string',
      };
    }
    return { valid: true };
  },

  image: (content) => {
    if (typeof content.data !== "string") {
      return {
        valid: false,
        error:
          'Image content must have a "data" property of type string (base64-encoded image)',
      };
    }
    if (typeof content.mimeType !== "string") {
      return {
        valid: false,
        error: 'Image content must have a "mimeType" property of type string',
      };
    }
    return { valid: true };
  },

  audio: (content) => {
    if (typeof content.data !== "string") {
      return {
        valid: false,
        error:
          'Audio content must have a "data" property of type string (base64-encoded audio)',
      };
    }
    if (typeof content.mimeType !== "string") {
      return {
        valid: false,
        error: 'Audio content must have a "mimeType" property of type string',
      };
    }
    return { valid: true };
  },

  resource_link: (content) => {
    if (typeof content.name !== "string") {
      return {
        valid: false,
        error:
          'Resource link content must have a "name" property of type string',
      };
    }
    if (typeof content.uri !== "string") {
      return {
        valid: false,
        error:
          'Resource link content must have a "uri" property of type string',
      };
    }
    // Optional fields validation
    if (content.title !== undefined && typeof content.title !== "string") {
      return {
        valid: false,
        error: 'Resource link "title" property must be a string if provided',
      };
    }
    if (
      content.description !== undefined &&
      typeof content.description !== "string"
    ) {
      return {
        valid: false,
        error:
          'Resource link "description" property must be a string if provided',
      };
    }
    if (
      content.mimeType !== undefined &&
      typeof content.mimeType !== "string"
    ) {
      return {
        valid: false,
        error: 'Resource link "mimeType" property must be a string if provided',
      };
    }
    return { valid: true };
  },
};

/**
 * Validates content and returns a detailed error message if invalid
 * applies for both tools and prompts
 */
export function validateContent(content: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!content || typeof content !== "object") {
    return {
      valid: false,
      error: "Content must be an object",
    };
  }

  const contentObj = content as any;

  if (typeof contentObj.type !== "string") {
    return {
      valid: false,
      error: 'Content must have a "type" property of type string',
    };
  }

  // Validate _meta field if present - this is optional tho
  if (
    contentObj._meta !== undefined &&
    (contentObj._meta === null || typeof contentObj._meta !== "object")
  ) {
    return {
      valid: false,
      error: 'Content "_meta" property must be an object if provided',
    };
  }

  const validator = contentValidators[contentObj.type];
  if (validator) {
    return validator(contentObj);
  }

  // unknown content types are allowed (future extensibility)
  return { valid: true };
}
