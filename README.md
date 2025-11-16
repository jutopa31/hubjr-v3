HubJR v3 (Minimal Fork)

This minimal fork preserves only the following modules with Supabase integration:

- Pase de sala (Ward Rounds)
- Pendientes (Tasks)
- Calendario (Medical Events)
- Académico (Clases + Recursos)

What’s included
- Vite + React + TypeScript + Tailwind setup (no Next.js)
- Supabase client configured via env vars or fallback
- Minimal auth context (session + privilege checks via RPC) to support modules
- Selected modules wired in a single-page tabbed UI

Folder structure
- src/modules/App.tsx – shell with tab navigation
- src/modules/WardRounds.tsx – ward rounds with archive to diagnostic_assessments
- src/modules/PendientesManager.tsx – tasks with sync to ward rounds
- src/modules/SimpleCalendar.tsx – medical events CRUD
- src/modules/AcademiaManager.tsx – academia shell
- src/modules/ClasesScheduler.tsx – simple classes scheduler
- src/modules/RecursosManager.tsx – academic resources CRUD
- src/modules/auth/AuthProvider.tsx – auth context wrapper
- src/shared/useAuth.ts – Supabase-based auth hook
- src/shared/useEscapeKey.ts – utility hook
- src/components/DeletePatientModal.tsx – modal used by Ward Rounds
- src/components/LoadingWithRecovery.tsx – robust loading UI
- src/utils/supabase.ts – Supabase client + logout helpers
- src/utils/pendientesSync.ts – sync helpers between ward rounds and tasks
- src/utils/queryHelpers.ts – timeout + retry wrappers
- src/utils/diagnosticAssessmentDB.ts – minimal archive + privileges RPCs

Supabase tables used
- ward_round_patients
- tasks
- medical_events
- academic_classes
- academic_resources
- diagnostic_assessments
- RPC: has_admin_privilege(user_email_param, privilege_type_param)

Setup
1) Copy .env.example to .env.local (or set environment variables):
   - VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY

2) Install and run:
   npm install
   npm run dev

Notes
- This fork intentionally drops all other pages, components, and services from the original app.
- The modules display friendly messages if required tables/policies are not present or lack RLS permissions.
- Archive from Ward Rounds writes a simplified record into diagnostic_assessments and checks for duplicate DNI.

