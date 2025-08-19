"use client";

import { useState } from "react";
import { createShowcaseSubmission } from "./actions";
import Image from "next/image";
import { cn } from "@/utils/cn";

interface FormData {
  name: string;
  tagline: string;
  logo: File | null;
  repositoryUrl: string;
  connectionMethod: string;
  contactEmail: string;
}

export function ShowcaseForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    tagline: "",
    logo: null,
    repositoryUrl: "",
    connectionMethod: "",
    contactEmail: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const isFormValid = () => {
    const requiredFields = [
      formData.name.trim(),
      formData.tagline.trim(),
      formData.logo,
      formData.connectionMethod.trim(),
      formData.contactEmail.trim(),
    ];

    return requiredFields.every((field) => !!field);
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
        name: formData.name,
        tagline: formData.tagline,
        logo: formData.logo?.name || "",
        repositoryUrl: formData.repositoryUrl,
        connectionMethod: formData.connectionMethod,
        contactEmail: formData.contactEmail,
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
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-xs font-medium uppercase text-[#DBDBDB]"
            >
              Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Your MCP server name"
              className={cn(
                "w-full px-3 py-3 border focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-[#747474] bg-transparent text-sm",
                errors.name ? "border-red-500" : "border-[#333333]"
              )}
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="connectionMethod"
              className="block text-xs font-medium uppercase text-[#DBDBDB]"
            >
              Connection Method *
            </label>
            <input
              id="connectionMethod"
              name="connectionMethod"
              type="text"
              value={formData.connectionMethod}
              onChange={handleInputChange}
              placeholder="STDIO command or HTTP endpoint"
              className={cn(
                "w-full px-3 py-3 border focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-[#747474] bg-transparent text-sm",
                errors.connectionMethod ? "border-red-500" : "border-[#333333]"
              )}
            />
            {errors.connectionMethod && (
              <p className="text-red-400 text-xs mt-1">
                {errors.connectionMethod}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="repositoryUrl"
              className="block text-xs font-medium uppercase text-[#DBDBDB]"
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
                "w-full px-3 py-3 border focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-[#747474] bg-transparent text-sm",
                errors.repositoryUrl ? "border-red-500" : "border-[#333333]"
              )}
            />
            {errors.repositoryUrl ? (
              <p className="text-red-400 text-xs mt-1">
                {errors.repositoryUrl}
              </p>
            ) : (
              <p className="text-xs text-[#747474]">
                Optional - for open source projects
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="tagline"
              className="block text-xs font-medium uppercase text-[#DBDBDB]"
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
                "w-full px-3 py-3 border focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-[#747474] bg-transparent text-sm",
                errors.tagline ? "border-red-500" : "border-[#333333]"
              )}
            />
            {errors.tagline && (
              <p className="text-red-400 text-xs mt-1">{errors.tagline}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="contactEmail"
              className="block text-xs font-medium uppercase text-[#DBDBDB]"
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
                "w-full px-3 py-3 border focus:ring-2 focus:ring-gray-100 focus:border-transparent outline-none transition-all duration-200 text-gray-200 placeholder-[#747474] bg-transparent text-sm",
                errors.contactEmail ? "border-red-500" : "border-[#333333]"
              )}
            />
            {errors.contactEmail && (
              <p className="text-red-400 text-xs mt-1">{errors.contactEmail}</p>
            )}
          </div>

          <div className="space-y-2 min-h-[102px] flex flex-col">
            <label className="block text-xs font-medium uppercase text-[#DBDBDB]">
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
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer focus:outline-none peer"
                />
                <div
                  className={cn(
                    "w-16 h-16 flex items-center justify-center bg-transparent hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer peer-focus:border-white",
                    errors.logo
                      ? "border border-red-500"
                      : logoPreview
                        ? "border border-[#333333]"
                        : "border border-dashed border-[#333333]"
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
              <div className="text-xs text-[#747474]">
                <p>PNG, JPG, or SVG</p>
                <p>Max 2MB, 512x512px recommended</p>
              </div>
            </div>
            {errors.logo && (
              <p className="text-red-400 text-xs mt-1">{errors.logo}</p>
            )}
            <div className="flex-1"></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-start lg:justify-end items-start lg:items-end pt-4 gap-4">
        <div className="lg:text-right">
          <p className="text-xs text-[#747474] max-w-[40rem]">
            By submitting, you agree to feature in our showcase. Any questions,
            contact{" "}
            <a href="mailto:xmcp@basement.studio" className="text-white">
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
