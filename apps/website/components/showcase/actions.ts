"use server";

import { fetchShowcaseForm } from "../../basehub";
import { sendEvent } from "basehub/events";
import { ShowcaseSchema, type ShowcaseFormData, type State } from "./schema";

async function validateShowcase(
  formData: ShowcaseFormData
): Promise<{ isValid: boolean; errors?: Record<string, string> }> {
  const errors: Record<string, string> = {};

  const validationResult = ShowcaseSchema.safeParse(formData);

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    Object.entries(fieldErrors).forEach(([key, value]) => {
      if (value?.[0]) {
        errors[key] = value[0];
      }
    });
  }

  // Connection method validation is handled by the schema

  return {
    isValid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

export async function createShowcaseSubmission(
  _prevState: State,
  formData: ShowcaseFormData
): Promise<State> {
  if (formData.reset) {
    return {
      errors: {},
      success: false,
    };
  }

  try {
    const validationResult = await validateShowcase(formData);
    if (!validationResult.isValid) {
      return {
        errors: validationResult.errors,
        success: false,
      };
    }

    const showcaseConfig = await fetchShowcaseForm();

    const submissionData = {
      name: formData.name,
      tagline: formData.tagline,
      logo: formData.logoFile,
      repositoryUrl: formData.repositoryUrl || "",
      connectionMethod: formData.connectionMethod,
      contactEmail: formData.contactEmail,
    };

    if (showcaseConfig?.submissions?.ingestKey) {
      await sendEvent(showcaseConfig.submissions.ingestKey, submissionData);
    } else {
      throw new Error("Showcase form configuration not found");
    }

    return { success: true };
  } catch (error) {
    console.error("Showcase submission error:", error);
    return {
      errors: {
        root: "Failed to submit showcase application",
        message: (error as Error).message,
      },
      success: false,
    };
  }
}
