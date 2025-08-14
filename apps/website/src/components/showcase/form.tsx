"use client";

import { useState } from "react";
import { createShowcaseSubmission } from "./actions";
import Image from "next/image";

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
  notifications: boolean;
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
    notifications: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
        notifications: formData.notifications,
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

      <div className="space-y-6">
        <h4 className="text-base font-medium text-white">Project Details</h4>

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
            className={`w-full px-4 py-3 border focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm ${
              errors.projectName ? "border-red-500" : "border-white"
            }`}
          />
          {errors.projectName && (
            <p className="text-red-400 text-sm mt-1">{errors.projectName}</p>
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
            className={`w-full px-4 py-3 border focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm ${
              errors.tagline ? "border-red-500" : "border-white"
            }`}
          />
          {errors.tagline && (
            <p className="text-red-400 text-sm mt-1">{errors.tagline}</p>
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
            placeholder="ai, productivity, automation, data-processing"
            className="w-full px-4 py-3 border border-white focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm"
          />
          <p className="text-sm text-gray-400">
            Separate multiple keywords with commas
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase text-white">
            Logo
          </label>
          <div className="flex items-start gap-4">
            <div className="relative">
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className={`w-20 h-20 flex items-center justify-center bg-transparent hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer ${
                  logoPreview
                    ? "border border-white"
                    : "border border-dashed border-gray-400"
                }`}
              >
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                    width={80}
                    height={80}
                  />
                ) : (
                  <svg
                    className="w-6 h-6 text-gray-400"
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
          </div>
          {errors.logo && (
            <p className="text-red-400 text-sm mt-1">{errors.logo}</p>
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
            className={`w-full px-4 py-3 border focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm ${
              errors.repositoryUrl ? "border-red-500" : "border-white"
            }`}
          />
          {errors.repositoryUrl ? (
            <p className="text-red-400 text-sm mt-1">{errors.repositoryUrl}</p>
          ) : (
            <p className="text-sm text-gray-400">
              If your project is open source, please provide your GitHub
              repository link
            </p>
          )}
        </div>

        <hr className="border-white my-8" />

        <div className="space-y-3">
          <h4 className="text-base font-medium text-white">
            Connection Methods
          </h4>
          {errors.transport && (
            <p className="text-red-400 text-sm">{errors.transport}</p>
          )}

          <div className="space-y-2">
            <label
              htmlFor="stdio"
              className="block text-xs font-medium uppercase text-white"
            >
              STDIO
            </label>
            <input
              id="stdio"
              name="stdio"
              type="text"
              value={formData.stdio}
              onChange={handleInputChange}
              placeholder="e.g., npx my-mcp-server or installation instructions"
              className="w-full px-4 py-3 border border-white focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="http"
              className="block text-xs font-medium uppercase text-white"
            >
              HTTP
            </label>
            <input
              id="http"
              name="http"
              type="url"
              value={formData.http}
              onChange={handleInputChange}
              placeholder="https://your-mcp-server.com/mcp"
              className="w-full px-4 py-3 border border-white focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm"
            />
          </div>
        </div>

        <hr className="border-white my-8" />

        <div className="space-y-4">
          <h4 className="text-base font-medium text-white">
            Contact Information
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
              className={`w-full px-4 py-3 border focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm ${
                errors.contactEmail ? "border-red-500" : "border-white"
              }`}
            />
            {errors.contactEmail && (
              <p className="text-red-400 text-sm mt-1">{errors.contactEmail}</p>
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
              className="w-full px-4 py-3 border border-white focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-gray-400 bg-transparent text-sm"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              id="notifications"
              name="notifications"
              type="checkbox"
              checked={formData.notifications}
              onChange={handleInputChange}
              className="sr-only"
            />
            <label
              htmlFor="notifications"
              className="flex items-center justify-center w-4 h-4 bg-transparent border border-white cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              {formData.notifications && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </label>
          </div>
          <label
            htmlFor="notifications"
            className="text-sm font-medium text-white cursor-pointer"
          >
            Notify me when my server is live in the showcase
          </label>
        </div>
      </div>

      <div className="flex justify-between items-end pt-4">
        <div className="flex-1 pr-6">
          <p className="text-xs text-[#BABABA]">
            By submitting your application, you agree to let us feature it in
            our showcase gallery. If you have any questions or would like to
            withdraw your submission, contact us at{" "}
            <a href="mailto:xmcp@basement.studio" className="underline">
              xmcp@basement.studio
            </a>
            .
          </p>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-white text-black py-3 px-4 font-medium hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase whitespace-nowrap"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
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
