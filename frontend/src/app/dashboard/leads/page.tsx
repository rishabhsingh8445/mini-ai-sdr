"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Lead } from "@/types";
import { LeadTable } from "@/components/leads/LeadTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Users, PlusCircle, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function AllLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get<Lead[]>("/api/leads");
      setLeads(res.data);
    } catch {
      // handled by axios interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/leads/${deleteId}`);
      setLeads((prev) => prev.filter((l) => l.id !== deleteId));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const filtered = leads.filter((l) => {
    const matchesSearch =
      search === "" ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.company || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 md:p-8 max-w-7xl mx-auto"
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">All Leads</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your contacts and AI qualification</p>
        </div>
        <Link href="/dashboard/leads/new" className="btn-primary">
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Add Lead
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-4 mb-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field sm:w-44"
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="qualified">Qualified</option>
            <option value="disqualified">Disqualified</option>
            <option value="contacted">Contacted</option>
          </select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700">
            {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <EmptyState
              icon={Users}
              title={leads.length === 0 ? "No leads yet" : "No leads match your filters"}
              description={
                leads.length === 0
                  ? "Add your first lead to get started with AI qualification."
                  : "Try adjusting your search or filters."
              }
              action={
                leads.length === 0 ? (
                  <Link href="/dashboard/leads/new" className="btn-primary">
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Add your first lead
                  </Link>
                ) : undefined
              }
            />
          </motion.div>
        ) : (
          <LeadTable leads={filtered} />
        )}
      </motion.div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete lead"
        message="This will permanently delete this lead and all associated emails."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </motion.div>
  );
}
