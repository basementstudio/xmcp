"use client";

import { useState } from "react";
import { createShowcaseSubmission } from "./actions";
import Image from "next/image";
import { cn } from "@/utils/cn";

interface FormData {
  projectName: string;
  tagline: string;
  keywords: string;
  logo: File | null;
  repositoryUrl: string;
  stdio: string;
  http: string;
  contactEmail: string;
  xAccount: string;
}

export function ShowcaseForm() {
  const [formData, setFormData] = useState<FormData>({
    projectName: "",
    tagline: "",
    keywords: "",
    logo: null,
    repositoryUrl: "",
    stdio: "",
    http: "",
    contactEmail: "",
    xAccount: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const isFormValid = () => {
    const requiredFields = [
      formData.projectName.trim(),
      formData.tagline.trim(),
      formData.logo,
      formData.contactEmail.trim(),
    ];

    const hasRequiredFields = requiredFields.every((field) => !!field);
    const hasConnectionMethod = !!(
      formData.stdio.trim() || formData.http.trim()
    );

    return hasRequiredFields && hasConnectionMethod;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      logo: file,
    }));

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const submissionData = {
        projectName: formData.projectName,
        tagline: formData.tagline,
        keywords: formData.keywords,
        logo: formData.logo?.name || "",
        repositoryUrl: formData.repositoryUrl,
        stdio: formData.stdio,
        http: formData.http,
        contactEmail: formData.contactEmail,
        xAccount: formData.xAccount,
        logoFile: formData.logo,
      };

      const result = await createShowcaseSubmission(
        { success: false },
        submissionData
      );

      if (result.success) {
        setIsSubmitted(true);
      } else {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          setErrors({ root: "Submission failed. Please try again." });
        }
      }
    } catch {
      setErrors({ root: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border border-white rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-white">
          Thank you for your submission
        </h3>
        <p className="text-gray-400">
          We&apos;ve received your application and will review it soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.root && (
        <div className="border border-red-500 p-3 mb-6 bg-red-900/20">
          <p className="text-red-400 text-sm">{errors.root}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-base font-medium text-white">
            1. Project Details
          </h4>

          <div className="space-y-2">
            <label
              htmlFor="projectName"
              className="block text-xs font-medium uppercase text-white"
            >
              Name *
            </label>
            <input
              id="projectName"
              name="projectName"
              type="text"
              value={formData.projectName}
              onChange={handleInputChange}
              placeholder="Your MCP server name"
              className={cn(
                "w-full px-3 py-2 border focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm",
                errors.projectName ? "border-red-500" : "border-white"
              )}
            />
            {errors.projectName && (
              <p className="text-red-400 text-xs mt-1">{errors.projectName}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="tagline"
              className="block text-xs font-medium uppercase text-white"
            >
              Tagline *
            </label>
            <input
              id="tagline"
              name="tagline"
              type="text"
              value={formData.tagline}
              onChange={handleInputChange}
              placeholder="A short description of what your MCP does"
              className={cn(
                "w-full px-3 py-2 border focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm",
                errors.tagline ? "border-red-500" : "border-white"
              )}
            />
            {errors.tagline && (
              <p className="text-red-400 text-xs mt-1">{errors.tagline}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="keywords"
              className="block text-xs font-medium uppercase text-white"
            >
              Keywords
            </label>
            <input
              id="keywords"
              name="keywords"
              type="text"
              value={formData.keywords}
              onChange={handleInputChange}
              placeholder="ai, productivity, automation"
              className="w-full px-3 py-2 border border-white focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase text-white">
              Logo *
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className={cn(
                    "w-16 h-16 flex items-center justify-center bg-transparent hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer",
                    errors.logo
                      ? "border border-red-500"
                      : logoPreview
                        ? "border border-white"
                        : "border border-dashed border-gray-400"
                  )}
                >
                  {logoPreview ? (
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                      width={64}
                      height={64}
                    />
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                <p>PNG, JPG, or SVG</p>
                <p>Max 2MB, 512x512px recommended</p>
              </div>
            </div>
            {errors.logo && (
              <p className="text-red-400 text-xs mt-1">{errors.logo}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="repositoryUrl"
              className="block text-xs font-medium uppercase text-white"
            >
              Repository URL
            </label>
            <input
              id="repositoryUrl"
              name="repositoryUrl"
              type="url"
              value={formData.repositoryUrl}
              onChange={handleInputChange}
              placeholder="https://github.com/username/project"
              className={cn(
                "w-full px-3 py-2 border focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm",
                errors.repositoryUrl ? "border-red-500" : "border-white"
              )}
            />
            {errors.repositoryUrl ? (
              <p className="text-red-400 text-xs mt-1">
                {errors.repositoryUrl}
              </p>
            ) : (
              <p className="text-xs text-gray-400">
                Optional - for open source projects
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-base font-medium text-white">
              2. Connection Methods *
            </h4>

            {errors.transport && (
              <p className="text-red-400 text-sm">{errors.transport}</p>
            )}

            <div className="space-y-2">
              <label
                htmlFor="stdio"
                className="block text-xs font-medium uppercase text-white"
              >
                STDIO Command
              </label>
              <input
                id="stdio"
                name="stdio"
                type="text"
                value={formData.stdio}
                onChange={handleInputChange}
                placeholder="npx my-mcp-server"
                className="w-full px-3 py-2 border border-white focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="http"
                className="block text-xs font-medium uppercase text-white"
              >
                HTTP Endpoint
              </label>
              <input
                id="http"
                name="http"
                type="url"
                value={formData.http}
                onChange={handleInputChange}
                placeholder="https://your-server.com/mcp"
                className="w-full px-3 py-2 border border-white focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-base font-medium text-white">
              3. Contact Information
            </h4>

            <div className="space-y-2">
              <label
                htmlFor="contactEmail"
                className="block text-xs font-medium uppercase text-white"
              >
                Contact Email *
              </label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className={cn(
                  "w-full px-3 py-2 border focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm",
                  errors.contactEmail ? "border-red-500" : "border-white"
                )}
              />
              {errors.contactEmail && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.contactEmail}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="xAccount"
                className="block text-xs font-medium uppercase text-white"
              >
                X Account
              </label>
              <input
                id="xAccount"
                name="xAccount"
                type="text"
                value={formData.xAccount}
                onChange={handleInputChange}
                placeholder="@username"
                className="w-full px-3 py-2 border border-white focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end pt-4 gap-4">
        <div className="flex-1">
          <p className="text-xs text-[#BABABA]">
            By submitting, you agree to feature in our showcase. Any questions,
            contact{" "}
            <a href="mailto:xmcp@basement.studio" className="underline">
              xmcp@basement.studio
            </a>
          </p>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !isFormValid()}
          className="bg-white text-black py-2 px-4 font-medium hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase whitespace-nowrap w-full lg:w-auto"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </span>
          ) : (
            "Submit for Review"
          )}
        </button>
      </div>
    </form>
  );
}
