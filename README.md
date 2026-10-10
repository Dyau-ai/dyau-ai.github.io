# Dyau.ai — Public Website & Interactive Malaysia e-Invoicing Live Demo

A clean, beginner-friendly SaaS demonstration website built with pure HTML, modern CSS, and vanilla JavaScript for deployment on **GitHub Pages** at:
👉 **https://dyau-ai.github.io/**

---

## 📁 Repository Structure

```
.
├── index.html         # Main Page (Company Overview + Expandable Demo Hub)
├── e-invoicing.html   # Fully Interactive Malaysia e-Invoicing Live Demo
├── demo.html          # Compatibility redirect to e-invoicing.html
├── css/
│   └── styles.css     # Responsive Corporate Stylesheet (Navy + White + Soft Teal)
├── styles.css         # Root copy of stylesheet for flexible static hosting
├── js/
│   └── e-invoicing.js # Interactive Live Demo Engine (Vanilla JavaScript)
└── README.md          # Publishing instructions and documentation
```

---

## 🚀 How to Publish to GitHub Pages (`https://dyau-ai.github.io/`)

### Step 1: Create or Confirm the GitHub Repository
1. On GitHub, create a repository named exactly:
   ```
   dyau-ai.github.io
   ```
   *(For user/organization pages, repositories named `<username>.github.io` automatically serve directly from the root of the `main` branch).*

### Step 2: Initialize Git and Push

```bash
cd /Users/sauravsahu/Documents/Anti-gravity-projects/Dyauai-einvoicing

# Initialize git (if not already initialized in this folder)
git init

# Stage the website files
git add index.html e-invoicing.html demo.html styles.css css/ js/ README.md

# Commit
git commit -m "Deploy Dyau.ai website with expandable Demo Hub and e-Invoicing demo"

# Set branch to main
git branch -M main

# Link to your remote GitHub repository
git remote add origin https://github.com/dyau-ai/dyau-ai.github.io.git

# Push to GitHub
git push -u origin main
```

### Step 3: Verify GitHub Pages Settings
1. Open the repository on GitHub: `https://github.com/dyau-ai/dyau-ai.github.io`
2. Go to **Settings** → **Pages** (under "Code and automation").
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/ (root)`
4. Click **Save**.
5. Within 1–2 minutes, your website will be live at:
   👉 **https://dyau-ai.github.io/**

---

## 🌟 Key Features

### 1. Main Page (`index.html`) & Expandable Demo Hub
- **Hero & Strategic Positioning**: Official tagline *"Wisdom Beyond Intelligence"* and *"AI, Data & Deep Technology for Enterprise"*.
- **About & 6 Core Capabilities**: Executive overview, intelligent automation, platforms, optimization, forward-deployed engineering, AI governance, and tech talent solutions.
- **Expandable Demo Hub**:
  - Built with a flexible responsive card grid (`minmax(360px, 1fr)`).
  - Renders 1 column on mobile and 2–3 columns on desktop.
  - Adding a new demo card in the future is as simple as inserting a new card block into `<div class="demo-hub-grid">` without altering any layout rules.
  - Includes a visual placeholder card highlighting upcoming enterprise solutions.

### 2. Interactive Live Demo (`e-invoicing.html`)
- **Document Type Selector**: Switch between:
  1. `Invoice (01)`
  2. `Credit Note (02)`
  3. `Debit Note (03)`
  4. `Refund Note (04)`
  5. `Self-billed Invoice (11)` — includes distinctive visual badge and guidance explaining buyer-issued transactions.
- **End-to-End Progress Stepper with Action Buttons**:
  - **Step 1: Data Arrival** → Raw JSON payload preview + clean grouped summary of fields. Button: *“Receive Data”*.
  - **Step 2: Data Stored** → Intake reference ID and secure queue receipt. Button: *“Process Document”*.
  - **Step 3: Platform Checks** → 3 verification cards (schema, tax math, registry identity). Button: *“Submit to LHDN MyInvois”*.
  - **Step 4: Submission** → Visual transmission between Dyau.ai Gateway and government API. Button: *“Get Validation Result”*.
  - **Step 5: Validation Result (User Choice)** → Interactive buttons for:
    - 🟢 **Success (Valid)** (generates UUID & unlocks final outputs)
    - 🟡 **On Hold** (holding reason & queuing notice)
    - 🔴 **Rejected** (error description & 1-click remediation)
    - ⚪ **Withdrawn / Cancelled** (72h cancellation receipt)
- **Final Outputs**:
  - **Validated e-Invoice Card**: Official stamped status, copyable UUID, line items table, and dummy QR code (*"Sample QR Code – Scan to Verify"*).
  - **Dual Downstream Outputs**: Side-by-side simulated **REST API JSON Response** and **Batch Reconciliation CSV File**.
- **User Tools**:
  - *“Reset Demo”* button at any stage.
  - 100% offline-ready static site with zero backend dependencies.
