# Dyau.ai — Public Website & Malaysia e-Invoicing Demonstration

A clean, beginner-friendly SaaS showcase and demonstration website for **Dyau.ai** built for deployment on **GitHub Pages** at `https://dyau-ai.github.io/`.

---

## 📁 File Structure

```
.
├── index.html         # Main Page (Company Overview, Capabilities, Locations)
├── demo.html          # Malaysia e-Invoicing SaaS Interactive Demonstration
├── css/
│   └── styles.css     # Corporate Theme (Deep Navy, White, Soft Teal Accents)
├── js/
│   └── demo.js        # Interactive Scenarios, Journey Steps, Modal & Clipboard
└── README.md          # Project overview & publishing guide
```

---

## 🚀 How to Publish to GitHub Pages (`dyau-ai.github.io`)

### Step 1: Create or Confirm the GitHub Repository
1. On GitHub, create a new public repository named exactly:
   ```
   dyau-ai.github.io
   ```
   *(Using the exact name `<organization-or-username>.github.io` automatically configures it as a user/organization GitHub Pages root site).*

### Step 2: Initialize Git and Commit the Files
In your project directory:

```bash
# 1. Initialize git (if not already a standalone repo)
git init

# 2. Add files
git add index.html demo.html css/ js/ README.md

# 3. Commit
git commit -m "Initial release: Dyau.ai website & Malaysia e-Invoicing demo"

# 4. Set branch to main
git branch -M main

# 5. Link to your GitHub repository
git remote add origin https://github.com/dyau-ai/dyau-ai.github.io.git

# 6. Push to GitHub
git push -u origin main
```

### Step 3: Verify GitHub Pages Settings
1. Go to your repository on GitHub: `https://github.com/dyau-ai/dyau-ai.github.io`
2. Navigate to **Settings** → **Pages** (under "Code and automation").
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/ (root)`
4. Click **Save**.
5. Within 1–2 minutes, your website will be live at:
   👉 **https://dyau-ai.github.io/**

---

## 🌟 Key Highlights

- **Executive & Non-Technical Ready**: Zero complex jargon or internal architecture revealed. Focused entirely on enterprise value, workflow simplicity, and LHDN compliance.
- **Realistic Sample Data**: Features compliant Malaysian dummy entities (`Dyau Demo Sdn Bhd` → `Example Trading Sdn Bhd`), valid SST breakdown, and realistic UUID formatting.
- **Interactive Scenarios**: Explore **Success (Valid)**, **On Hold**, **Rejected**, and **Withdrawn / Cancelled** with instant visual feedback.
- **Validated e-Invoice Preview**: Complete with vector QR code ("Sample QR Code – Scan to Verify") and official clearance timestamp.
- **Fast & Responsive**: Pure HTML5, modern CSS3, and lightweight vanilla JavaScript. No heavy frameworks or external dependencies.
