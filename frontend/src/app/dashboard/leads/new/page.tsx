"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { Lead, LeadCreate } from "@/types";
import { LeadForm } from "@/components/leads/LeadForm";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function NewLeadPage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (data: LeadCreate) => {
    setError("");
    try {
      const res = await api.post<Lead>("/api/leads", data);
      setSuccess(true);
      setTimeout(() => router.push(`/dashboard/leads/${res.data.id}`), 1200);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create lead. Please try again.");
      throw err;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Add New Lead</h1>
        <p className="text-gray-500 text-sm mt-2">
          Fill in the lead details. The more information you provide, the better the AI qualification.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl mb-6 text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Lead created successfully! Redirecting...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="card p-8 bg-white border border-gray-200 shadow-sm">
        <LeadForm onSubmit={handleSubmit} submitLabel="Create Lead" />
      </div>
    </div>
  );
}
