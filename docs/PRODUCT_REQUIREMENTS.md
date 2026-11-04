# Product requirements (condensed)

**Promise:** your digital home's security & internet doctor. **Flow:** detect → explain in plain English → propose a safe fix → help do it → verify → recommend prevention.

**Users:** nontechnical households first; students/enthusiasts via Advanced Lab; very small businesses later.

**Non-negotiables**
- Evidence on every finding (observed data, time, confidence, severity, limitations).
- Unknown ≠ safe. No sensor ⇒ "monitoring not configured", never "protected".
- Privacy first: local-first, consent for device inventory, retention/export/delete, no default third-party calls, AI optional and off.
- Browser, sensor and gateway capabilities are explained honestly (`/how-it-works`).
- No fake integrations, checkout, VPN, email, or MFA. Unsupported actions are disabled with an explanation.
- WCAG 2.2 AA target, keyboard/screen-reader friendly, responsive, reduced motion.

**Acceptance criteria** are the checklist in the master prompt; their status is tracked in `FEATURE_STATUS.md`.

**Terminology rules** (see also the UX directive): lead with the human symptom ("Websites are having trouble loading"), explain in one sentence, give one primary action, tuck jargon behind "Show technical details".
