export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  company: string | null;
  job_title: string | null;
  industry: string | null;
  linkedin_url: string | null;
  notes: string | null;
  status: "new" | "qualified" | "disqualified" | "contacted";
  qualification_score: number | null;
  qualification_reason: string | null;
  qualification_recommendation: string | null;
  qualification_updated_at: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface LeadCreate {
  name: string;
  email: string;
  company?: string;
  job_title?: string;
  industry?: string;
  linkedin_url?: string;
  notes?: string;
  status?: string;
}

export interface LeadUpdate extends Partial<LeadCreate> {}

export interface GeneratedEmail {
  id: number;
  lead_id: number;
  subject: string;
  body: string;
  call_script?: string | null;
  created_at: string;
}

export interface CallScript {
  id: number;
  lead_id: number;
  mode: string;
  script_body: string;
  created_at: string;
}

export interface ApiError {
  detail: string;
}
