-- Mini AI SDR Seed Data
-- Password for demo user: Demo@123456
-- Hashed with bcrypt (12 rounds)

INSERT INTO users (email, hashed_password, full_name, is_active) VALUES
(
    'demo@minisdr.com',
    '$2b$12$u9cDB1eSu.mgdnM5EQJ/TueFTZpuaHiTDZgo5y3pWbryMhPQdUF9S',
    'Demo User',
    true
)
ON CONFLICT (email) DO NOTHING;

-- Seed leads for demo user (owner_id = 1)
INSERT INTO leads (name, email, company, job_title, industry, linkedin_url, notes, status, owner_id)
SELECT
    'Sarah Chen',
    'sarah.chen@techcorp.io',
    'TechCorp Solutions',
    'VP of Engineering',
    'Software & Technology',
    'https://linkedin.com/in/sarah-chen',
    'Met at SaaStr conference. Very interested in developer tools. Has budget for Q3.',
    'new',
    u.id
FROM users u WHERE u.email = 'demo@minisdr.com'
ON CONFLICT DO NOTHING;

INSERT INTO leads (name, email, company, job_title, industry, linkedin_url, notes, status, qualification_score, qualification_reason, qualification_recommendation, owner_id)
SELECT
    'Marcus Rodriguez',
    'marcus.rodriguez@growthco.com',
    'GrowthCo Inc',
    'Chief Revenue Officer',
    'SaaS',
    'https://linkedin.com/in/marcus-rodriguez',
    'Referred by existing customer. Running a 200-person sales team. Evaluation in progress.',
    'qualified',
    87.5,
    'Senior executive with direct budget authority at a mid-market SaaS company. High seniority (CRO), strong industry fit, and active evaluation signal make this an excellent prospect.',
    'Prioritize this lead immediately. Schedule an executive-level demo with your VP of Sales. Prepare ROI analysis for a 200-seat deployment.',
    u.id
FROM users u WHERE u.email = 'demo@minisdr.com'
ON CONFLICT DO NOTHING;

INSERT INTO leads (name, email, company, job_title, industry, linkedin_url, notes, status, qualification_score, qualification_reason, qualification_recommendation, owner_id)
SELECT
    'Priya Patel',
    'priya.patel@financeplus.com',
    'FinancePlus Ltd',
    'Head of Operations',
    'Financial Services',
    'https://linkedin.com/in/priya-patel',
    'Downloaded whitepaper last week. Opened 3 emails. Team of 50.',
    'qualified',
    72.0,
    'Mid-level decision influencer in a regulated industry with demonstrated interest signals (content downloads, email opens). Financial services represents a strong vertical fit.',
    'Send a personalized case study from a similar financial services client. Follow up with a 15-minute discovery call focused on compliance and efficiency gains.',
    u.id
FROM users u WHERE u.email = 'demo@minisdr.com'
ON CONFLICT DO NOTHING;

INSERT INTO leads (name, email, company, job_title, industry, linkedin_url, notes, status, owner_id)
SELECT
    'James Wilson',
    'james.wilson@startup.xyz',
    'Startup XYZ',
    'Founder & CEO',
    'E-commerce',
    NULL,
    'Early-stage startup. 5 employees. Limited budget but fast growing.',
    'new',
    u.id
FROM users u WHERE u.email = 'demo@minisdr.com'
ON CONFLICT DO NOTHING;

INSERT INTO leads (name, email, company, job_title, industry, linkedin_url, notes, status, qualification_score, qualification_reason, qualification_recommendation, owner_id)
SELECT
    'Linda Park',
    'linda.park@healthcare.org',
    'HealthCare Systems',
    'IT Director',
    'Healthcare',
    'https://linkedin.com/in/linda-park',
    'Compliance-focused. HIPAA requirements are critical. Budget approved for next fiscal year.',
    'disqualified',
    38.0,
    'While IT Director role is relevant, the non-profit healthcare sector typically has constrained budgets and lengthy procurement cycles. Next fiscal year timeline reduces urgency.',
    'Add to long-term nurture sequence. Send healthcare compliance resources. Re-engage in Q4 when their new fiscal year budget becomes active.',
    u.id
FROM users u WHERE u.email = 'demo@minisdr.com'
ON CONFLICT DO NOTHING;

-- Seed a generated email for Marcus Rodriguez
INSERT INTO generated_emails (lead_id, subject, body)
SELECT
    l.id,
    'Helping GrowthCo scale your 200-person sales team',
    E'Hi Marcus,\n\nI came across GrowthCo while researching high-growth SaaS companies and was impressed by how quickly your team has scaled.\n\nRunning a 200-person sales team is no small feat — and I imagine keeping everyone aligned, coached, and hitting quota is a constant challenge. We work with CROs at companies like yours to cut ramp time by 40% and improve quota attainment through AI-assisted coaching.\n\nWould a 15-minute call this week make sense to see if there''s a fit? I can share how we helped a similar SaaS company add $2M ARR in one quarter.\n\nBest,\nThe Mini SDR Team'
FROM leads l WHERE l.email = 'marcus.rodriguez@growthco.com'
ON CONFLICT DO NOTHING;
