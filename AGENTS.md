# Architecture rules
- Training assessments have a unique foreign key to their training; fetch and submit by both training and assessment IDs to prevent cross-training evaluation mix-ups.
- Keep answer keys in an admin-only table and grade submissions through authenticated database functions, never in the learner's browser.
- Reuse the shared Button for new interactive actions and existing semantic theme classes to preserve the portal's appearance.