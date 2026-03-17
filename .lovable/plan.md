

# Sickle Cell VOC Prediction CDSS

## Overview
A clinical decision support system that predicts vaso-occlusive crisis risk in sickle cell disease patients using AI analysis of patient vitals, with explainable results and actionable intervention protocols.

## Design System
- **Clinical, data-dense layout** inspired by Stripe Dashboard — matte surfaces, geometric, serious tone
- **Trust Blue** primary color with a traffic-light risk scale (Green/Amber/Red)
- **IBM Plex Mono** for all numerical data; **Geist Sans** (or Inter as fallback) for UI text
- Light mode default, high-density 4px grid, 6px border radius

## Architecture
- **Frontend:** React + Tailwind + Recharts for vitals sparklines
- **Backend:** Supabase (Lovable Cloud) for database, auth, and edge functions
- **AI:** Lovable AI (Gemini) via edge function — receives patient vitals, returns structured risk assessment (score, contributing factors, recommended protocol)

## Pages & Layout

### 1. Login Page
- Simple email/password auth for clinicians
- Clean, clinical branding

### 2. Main Dashboard (Sidebar + Main Stage)
- **Sidebar (280px):** Searchable patient list with color-coded status badges (Stable/Elevated/Critical)
- **Main Stage** (when patient selected):
  - **Risk Gauge (Col 1, 40%):** Semi-circle gauge showing VOC risk % + AI confidence score
  - **Evidence Panel (Col 2, 60%):** Sparklines for Heart Rate, SpO2, Temperature, HbS levels with AI-highlighted anomalies
  - **Contributing Factors:** Tags showing which vitals drove the score (e.g., "SpO2 ↓: +18% impact")
  - **24-hour Trend:** Line chart showing risk score over time
- **Footer Action Bar:** "Start Protocol" button (Hydration/Analgesia/Transfusion) or "Dismiss Alert"

### 3. Patient Management
- Add new patients with demographics and baseline vitals
- Record new vital readings (HR, SpO2, Temp, HbS, Reticulocyte count, Hydration status, Pain score)
- View patient history and past assessments

### 4. Assessment History
- Table of past AI assessments per patient with timestamps, scores, and actions taken

## AI Integration (Edge Function)
- Edge function sends patient vitals to Lovable AI with a clinical system prompt
- AI returns structured output via tool calling: `risk_score` (0-100), `confidence`, `contributing_factors` (with impact %), `recommended_protocol`, and `clinical_reasoning`
- Results displayed instantly in the dashboard with explainability front and center

## Database Tables
- **profiles** — clinician accounts
- **patients** — demographics, diagnosis info
- **vitals** — timestamped vital readings per patient
- **assessments** — AI risk results, contributing factors, recommended actions
- **user_roles** — role-based access (admin/clinician)

## Key UX Details
- Skeleton loaders (no spinners) to maintain spatial context
- Risk score number flashes blue highlight on AI recalculation
- No modals for data — everything on one plane
- Instant re-entry: color-coded sidebar lets clinicians orient in 1 second

