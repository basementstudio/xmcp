import { z } from "zod";

export const ShowcaseSchema = z
  .object({
    projectName: z.string().min(1, "Project name is required"),
    tagline: z.string().min(1, "Tagline is required"),
    keywords: z.string(),
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
    stdio: z.string().optional(),
    http: z.string().optional(),
    contactEmail: z.string().email("Please enter a valid email address"),
    xAccount: z.string().optional(),
  })
  .refine((data) => data.stdio?.trim() || data.http?.trim(), {
    message: "Please provide at least one connection method.",
    path: ["transport"],
  });

export type ShowcaseFormData = z.infer<typeof ShowcaseSchema> & {
  reset?: boolean;
  logoFile?: File | null;
};

export type State = {
  errors?: Record<string, string>;
  success?: boolean;
};
