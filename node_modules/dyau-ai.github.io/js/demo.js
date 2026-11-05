/**
 * Dyau.ai - Malaysia e-Invoicing Interactive Demonstration
 * Lightweight client script for scenario exploration, step journey, and modal dialogs.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });
  }

  // Scenario Switcher Data
  const scenarios = {
    success: {
      statusClass: 'result-success',
      pillClass: 'pill-success',
      statusText: 'Valid',
      title: 'Scenario: Document Validated by LHDN MyInvois',
      message: 'Status: VALID • Official UUID Issued',
      description: 'The invoice was received, schema-checked, tax calculations verified, and successfully acknowledged by the LHDN MyInvois platform. A permanent UUID is minted.',
      uuid: '7F4B92E1-4921-48C9-A780-B149E0832DE8',
      validationTime: '10 October 2026, 12:49:58 MYT',
      showValidatedCard: true
    },
    hold: {
      statusClass: 'result-hold',
      pillClass: 'pill-hold',
      statusText: 'On Hold',
      title: 'Scenario: Buyer Registration Under Review',
      message: 'Status: ON HOLD • Reason: Buyer TIN Mismatch',
      description: 'LHDN placed this submission on hold because the Buyer’s Tax Identification Number (TIN: C10987654020) is undergoing registration sync or requires confirmation. The system notifies your finance team instantly with clear instructions to re-trigger.',
      uuid: 'Pending Resolution (ID: HOLD-2026-00412)',
      validationTime: '10 October 2026, 12:50:02 MYT (Queued)',
      showValidatedCard: false
    },
    rejected: {
      statusClass: 'result-rejected',
      pillClass: 'pill-rejected',
      statusText: 'Rejected',
      title: 'Scenario: Validation Exception Detected',
      message: 'Status: REJECTED • Error: Line 2 Tax Exemption Code Incompatible',
      description: 'LHDN rejected the invoice submission due to an incompatible tax exemption code declared for Line Item 2. The platform pinpointed the exact item and provided a plain-English remediation guide before re-submitting.',
      uuid: 'Not Issued (Rejected Submission)',
      validationTime: '10 October 2026, 12:50:15 MYT',
      showValidatedCard: false
    },
    cancelled: {
      statusClass: 'result-cancelled',
      pillClass: 'pill-cancelled',
      statusText: 'Cancelled',
      title: 'Scenario: Document Cancelled / Withdrawn',
      message: 'Status: CANCELLED • Withdrawn by Supplier within 72h Window',
      description: 'The supplier exercised their standard right to cancel this validated e-Invoice within the official 72-hour regulatory window. Both buyer and seller systems are automatically updated with the cancellation certificate.',
      uuid: '7F4B92E1-4921-48C9-A780-B149E0832DE8 (Status: Revoked)',
      validationTime: '10 October 2026, 14:15:00 MYT (Cancelled)',
      showValidatedCard: false
    }
  };

  // Scenario Tabs Logic
  const tabButtons = document.querySelectorAll('.scenario-tab-btn');
  const scenarioBox = document.getElementById('scenario-result-box');
  const scenarioPill = document.getElementById('scenario-status-pill');
  const scenarioMsg = document.getElementById('scenario-result-message');
  const scenarioDesc = document.getElementById('scenario-result-desc');
  const validatedCard = document.getElementById('validated-preview-card');

  if (tabButtons.length > 0 && scenarioBox) {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetScenario = btn.getAttribute('data-scenario');
        const data = scenarios[targetScenario];

        if (!data) return;

        // Active tab styling
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update scenario box
        scenarioBox.className = `scenario-result-box ${data.statusClass}`;
        scenarioPill.className = `result-status-pill ${data.pillClass}`;
        scenarioPill.textContent = data.statusText;
        scenarioMsg.textContent = data.message;
        scenarioDesc.textContent = data.description;

        // Toggle Validated Preview Card
        if (validatedCard) {
          if (data.showValidatedCard) {
            validatedCard.style.display = 'block';
          } else {
            validatedCard.style.display = 'none';
          }
        }
      });
    });
  }

  // Interactive 7-Step Journey Click
  const steps = document.querySelectorAll('.journey-step');
  if (steps.length > 0) {
    steps.forEach((step, idx) => {
      step.addEventListener('click', () => {
        steps.forEach(s => s.classList.remove('active'));
        step.classList.add('active');
      });
    });
  }

  // Copy UUID to clipboard
  const copyBtn = document.getElementById('copy-uuid-btn');
  const toast = document.getElementById('copy-toast');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const uuidText = document.getElementById('display-uuid')?.textContent || '7F4B92E1-4921-48C9-A780-B149E0832DE8';
      navigator.clipboard.writeText(uuidText.trim()).then(() => {
        if (toast) {
          toast.classList.add('show');
          setTimeout(() => {
            toast.classList.remove('show');
          }, 2000);
        }
      });
    });
  }

  // Modal Handlers (Request Live Demo)
  const openModalBtns = document.querySelectorAll('.open-demo-modal');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  const demoModal = document.getElementById('demo-modal');

  if (openModalBtns && demoModal) {
    openModalBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        demoModal.classList.add('active');
      });
    });
  }

  if (closeModalBtns && demoModal) {
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        demoModal.classList.remove('active');
      });
    });

    demoModal.addEventListener('click', (e) => {
      if (e.target === demoModal) {
        demoModal.classList.remove('active');
      }
    });
  }

  // Demo Form Submission Simulation
  const demoForm = document.getElementById('demo-request-form');
  if (demoForm) {
    demoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = demoForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Demo Requested! Redirecting...';
        submitBtn.disabled = true;
      }
      setTimeout(() => {
        alert('Thank you! A Dyau.ai enterprise solutions specialist will contact you shortly to schedule your personalized live demonstration.');
        if (demoModal) demoModal.classList.remove('active');
        if (submitBtn) {
          submitBtn.textContent = 'Submit Request';
          submitBtn.disabled = false;
        }
        demoForm.reset();
      }, 700);
    });
  }

  // QR Code Click Info
  const qrBox = document.querySelector('.qr-box');
  if (qrBox) {
    qrBox.addEventListener('click', () => {
      alert('Verification Simulation:\n\nUUID: 7F4B92E1-4921-48C9-A780-B149E0832DE8\nStatus: Valid\nIssuer: Dyau Demo Sdn Bhd\nBuyer: Example Trading Sdn Bhd\nGrand Total: MYR 9,720.00\nValidation Time: 10 Oct 2026, 12:49:58 MYT\n\n(This QR code is for customer demonstration purposes.)');
    });
  }
});
