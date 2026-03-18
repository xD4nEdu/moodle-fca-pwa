# PWA Redesign (Glassmorphism & Dynamic) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a premium glassmorphism UI for the Moodle FCA PWA with animated expanding notifications and redundant security headers.

**Architecture:** Refactor the monolith `Registration.jsx` into functional components. Use Framer Motion for layout transitions (expanding cards) and staggered list entry. Implement a global CSS design system for glass effects.

**Tech Stack:** React 18, Tailwind CSS, Framer Motion, Lucide React.

---

### Task 1: Setup & Dependencies
**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Add dependencies to package.json**
Add `framer-motion` and `lucide-react`.

- [ ] **Step 2: Run install**
Execute: `npm install` (simulated by updating file since we are in a dev environment and user will deploy).

---

### Task 2: Global Design System & Background
**Files:**
- Modify: `frontend/src/index.css`
- Create: `frontend/src/components/BackgroundGlow.jsx`

- [ ] **Step 1: Add Glassmorphism utilities to CSS**
Define custom blur and border tokens.

- [ ] **Step 2: Implement BackgroundGlow component**
Create a component with animated radial gradients using Framer Motion.

---

### Task 3: Glass UI Components
**Files:**
- Create: `frontend/src/components/GlassCard.jsx`
- Create: `frontend/src/components/ThemeToggleEnhanced.jsx` (Redesign of existant toggle)

- [ ] **Step 1: Create GlassCard**
A wrapper component with `backdrop-blur-xl` and `bg-white/5`.

---

### Task 4: Interactive Notification Item (Accordion)
**Files:**
- Create: `frontend/src/components/NotificationItem.jsx`

- [ ] **Step 1: Build the Expanding Item**
Use `AnimatePresence` and `motion.div` for height expansion. 
Include accessibility: `role="button"`, `aria-expanded`, and `onKeyDown`.

---

### Task 5: Assembly & Deployment
**Files:**
- Modify: `frontend/src/Registration.jsx`

- [ ] **Step 1: Refactor Registration view**
Integrate new components. Replace state-based list with the `NotificationItem` components.

- [ ] **Step 2: Verify and Push to Git**
`git add .`, `git commit -m "feat: complete glassmorphism redesign"`, `git push origin main`.
