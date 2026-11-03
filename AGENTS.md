# Architecture rules
- Training assessments have a unique foreign key to their training; fetch and submit by both training and assessment IDs to prevent cross-training evaluation mix-ups.
- Keep answer keys in an admin-only table and grade submissions through authenticated database functions, never in the learner's browser.
- Reuse the shared Button for new interactive actions and existing semantic theme classes to preserve the portal's appearance.
- Manager reporting uses authenticated read-only RPCs with server-side role checks rather than widening profile or live answer-key access, to preserve existing permissions.
- Capture immutable question, key and display-name snapshots in a private result-details table through an insert trigger; do not change assessment execution, and never reconstruct missing history from a mutable exam.
- AI exam generation runs in an admin-authenticated Edge Function using the Gateway SDK and saved training content; return a validated draft to the existing editor and persist only through the existing assessment-save RPC, keeping generation separate from replacement.