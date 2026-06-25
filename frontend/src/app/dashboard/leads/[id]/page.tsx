"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { Lead, LeadCreate } from "@/types";
import { LeadForm } from "@/components/leads/LeadForm";
import { QualificationPanel } from "@/components/ai/QualificationPanel";
import { EmailPanel } from "@/components/ai/EmailPanel";
import { CallScriptPanel } from "@/components/ai/CallScriptPanel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDate, getScoreBadgeColor, getScoreLabel } from "@/lib/utils";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  ExternalLink,
  Building2,
  Briefcase,
  Tag,
  Calendar,
  X,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "new":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "qualified":
      return "bg-green-50 text-green-700 border-green-200";
    case "disqualified":
      return "bg-red-50 text-red-700 border-red-200";
    case "contacted":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await api.get<Lead>(`/api/leads/${leadId}`);
      setLead(res.data);
    } catch {
      setError("Lead not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: LeadCreate) => {
    setSaving(true);
    setError("");
    try {
      const res = await api.put<Lead>(`/api/leads/${leadId}`, data);
      setLead(res.data);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update lead.");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/leads/${leadId}`);
      router.push("/dashboard/leads");
    } catch {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <p className="text-red-500">Lead not found.</p>
        <Link href="/dashboard" className="text-accent-600 hover:text-accent-700 mt-2 inline-block transition-colors">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-5 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4 flex-shrink-0"
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        {saveSuccess && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-3 text-green-700 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Lead updated successfully.
          </motion.div>
        )}

        {error && !editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-3 bg-red-50 border border-red-200 rounded-xl mb-3 text-sm text-red-600">
            {error}
          </motion.div>
        )}

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{lead.name}</h1>
              <span className={`badge ${getStatusBadgeColor(lead.status)} capitalize`}>
                {lead.status}
              </span>
              {lead.qualification_score !== null && (
                <span className={`badge ${lead.qualification_score >= 80 ? "bg-green-50 text-green-700 border-green-200" : lead.qualification_score >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                  {getScoreLabel(lead.qualification_score)} · {lead.qualification_score}/100
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-1 text-sm">{lead.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="btn-secondary py-2"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="btn-danger py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </button>
              </>
            )}
            {editing && (
              <button
                onClick={() => setEditing(false)}
                className="btn-secondary py-2"
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0"
      >
        {/* Left: Lead info or edit form */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          {editing ? (
            <motion.div variants={itemVariants} className="card p-5 bg-white border border-gray-200 shadow-sm overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-tight">Edit Lead</h2>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-600">
                  {error}
                </div>
              )}
              <LeadForm
                defaultValues={lead}
                onSubmit={handleUpdate}
                submitLabel="Save Changes"
                isSubmitting={saving}
              />
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="card p-5 bg-white border border-gray-200 shadow-sm flex-shrink-0 relative overflow-hidden">
              <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-tight relative z-10">Lead Information</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                {[
                  { label: "Company", value: lead.company, icon: Building2 },
                  { label: "Job Title", value: lead.job_title, icon: Briefcase },
                  { label: "Industry", value: lead.industry, icon: Tag },
                  { label: "Added", value: formatDate(lead.created_at), icon: Calendar },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label}>
                    <dt className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </dt>
                    <dd className="text-sm text-gray-900">{value || <span className="text-gray-400">—</span>}</dd>
                  </div>
                ))}

                {lead.linkedin_url && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-gray-500 mb-1">LinkedIn</dt>
                    <dd>
                      <a
                        href={lead.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent-600 hover:text-accent-700 transition-colors hover:underline inline-flex items-center gap-1.5"
                      >
                        {lead.linkedin_url}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </dd>
                  </div>
                )}

                {lead.notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-gray-500 mb-1">Notes</dt>
                    <dd className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-24 overflow-y-auto whitespace-pre-line">
                      {lead.notes}
                    </dd>
                  </div>
                )}
              </dl>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar pr-2">
            <EmailPanel lead={lead} />
            <CallScriptPanel lead={lead} />
          </motion.div>
        </div>

        {/* Right: AI Analysis (merged qualification + LangGraph agent) */}
        <motion.div variants={itemVariants} className="flex flex-col min-h-0 overflow-y-auto">
          <QualificationPanel lead={lead} onUpdate={setLead} />
        </motion.div>
      </motion.div>

      <ConfirmDialog
        isOpen={deleteOpen}
        title="Delete lead"
        message={`Are you sure you want to delete "${lead.name}"? All AI emails will also be removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
      />
    </motion.div>
  );
}
