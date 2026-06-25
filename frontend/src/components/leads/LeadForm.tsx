"use client";

import { useForm } from "react-hook-form";
import { Lead, LeadCreate } from "@/types";
import { cn } from "@/lib/utils";

const INDUSTRIES = [
  "Software & Technology",
  "SaaS",
  "Financial Services",
  "Healthcare",
  "E-commerce",
  "Manufacturing",
  "Retail",
  "Media & Entertainment",
  "Education",
  "Real Estate",
  "Professional Services",
  "Other",
];

const STATUSES = ["new", "contacted", "qualified", "disqualified"];

interface LeadFormProps {
  defaultValues?: Partial<Lead>;
  onSubmit: (data: LeadCreate) => Promise<void>;
  submitLabel: string;
  isSubmitting?: boolean;
}

export function LeadForm({ defaultValues, onSubmit, submitLabel, isSubmitting }: LeadFormProps) {
  // We use react-hook-form here to avoid writing repetitive state handlers 
  // for every single input field. It also handles basic validation efficiently.
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadCreate>({ defaultValues: defaultValues as any });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="Jane Smith"
            className={cn("input-field", errors.name && "border-red-400 focus:border-red-400 focus:ring-red-400/20")}
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            placeholder="jane@company.com"
            className={cn("input-field", errors.email && "border-red-400 focus:border-red-400 focus:ring-red-400/20")}
            {...register("email", {
              required: "Email is required",
              pattern: { value: /\S+@\S+\.\S+/, message: "Enter a valid email" },
            })}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
          <input
            type="text"
            placeholder="Acme Corp"
            className="input-field"
            {...register("company")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title</label>
          <input
            type="text"
            placeholder="VP of Engineering"
            className="input-field"
            {...register("job_title")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
          <select className="input-field [&>option]:bg-white" {...register("industry")}>
            <option value="">Select an industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
          <select className="input-field [&>option]:bg-white" {...register("status")}>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">LinkedIn URL</label>
          <input
            type="url"
            placeholder="https://linkedin.com/in/username"
            className={cn("input-field", errors.linkedin_url && "border-red-500 focus:border-red-500 focus:ring-red-500/20")}
            {...register("linkedin_url", {
              validate: (value) => {
                if (!value) return true; // Optional field
                return (
                  value.startsWith("https://linkedin.com/") ||
                  value.startsWith("https://www.linkedin.com/") ||
                  "Please enter a valid LinkedIn URL"
                );
              }
            })}
          />
          {errors.linkedin_url && (
            <p className="mt-1.5 text-xs text-red-500">{errors.linkedin_url.message as string}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea
            rows={4}
            placeholder="Add any relevant context about this lead..."
            className="input-field resize-none"
            {...register("notes")}
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary px-8 py-2.5 shadow-sm hover:shadow">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Saving...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
