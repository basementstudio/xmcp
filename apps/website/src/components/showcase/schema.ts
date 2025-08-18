import { z } from "zod";

export const ShowcaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tagline: z.string().min(1, "Tagline is required"),
  logo: z.string().min(1, "Logo is required"),
  repositoryUrl: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        const githubRegex =
          /^(https:\/\/)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;
        return githubRegex.test(val.trim());
      },
      {
        message:
          "Please enter a valid GitHub repository URL (e.g., https://github.com/username/project or github.com/username/project).",
      }
    ),
  connectionMethod: z.string().min(1, "Connection method is required"),
  contactEmail: z.string().email("Please enter a valid email address"),
});

export type ShowcaseFormData = z.infer<typeof ShowcaseSchema> & {
  reset?: boolean;
  logoFile?: File | null;
};

export type State = {
  errors?: Record<string, string>;
  success?: boolean;
};
