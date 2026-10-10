/**
 * Dyau.ai - Malaysia e-Invoicing Interactive SaaS Platform Engine
 * Pure vanilla JavaScript driving:
 * 1. Top Workspace Tabs Navigation
 * 2. Tab 1: Live End-to-End Demo (Document types, 5 steps, outcomes, dual outputs)
 * 3. Tab 2: Master Data Management (Search, filter, view details, add/edit party modal)
 * 4. Tab 3: Reporting Dashboard (Live interactive filtering, KPI cards, visual breakdown)
 * 5. Tab 4: Administration (Interactive toggles, role matrix, audit log)
 */

// ============================================================================
// DATASET 1: LIVE DEMO DOCUMENT TYPES
// ============================================================================
const docDatasets = {
  invoice: {
    typeKey: 'invoice',
    code: '01',
    name: 'Invoice',
    label: 'Standard Commercial Invoice (B2B)',
    isSelfBilled: false,
    docNumber: 'INV-2026-00128',
    docDate: '10 October 2026',
    currency: 'MYR',
    originalRef: 'N/A (Primary Transaction)',
    issuerTitle: 'Supplier (Seller / Issuer)',
    issuerName: 'Dyau Demo Sdn Bhd',
    issuerTIN: 'C25890123010',
    issuerBRN: '202401048899 (1559876-A)',
    issuerSST: 'W10-2401-32000045',
    issuerAddress: 'Level 28, Menara Binjai, No. 2 Jalan Binjai, 50450 Kuala Lumpur',
    counterpartyTitle: 'Buyer (Customer / Recipient)',
    counterpartyName: 'Example Trading Sdn Bhd',
    counterpartyTIN: 'C10987654020',
    counterpartyBRN: '201901023456 (1345678-W)',
    counterpartySST: 'W10-1903-21000892',
    counterpartyAddress: 'Suite 12-05, Plaza Mont Kiara, 50480 Kuala Lumpur',
    items: [
      { desc: 'Cloud Optimization Advisory Services', qty: 1, price: '5,000.00', taxRate: '8% SST', taxAmt: '400.00', total: '5,400.00' },
      { desc: 'Enterprise Software Subscription (10 Seats)', qty: 10, price: '250.00', taxRate: '8% SST', taxAmt: '200.00', total: '2,700.00' },
      { desc: 'Implementation & Setup Support', qty: 1, price: '1,500.00', taxRate: '8% SST', taxAmt: '120.00', total: '1,620.00' }
    ],
    subtotal: 'MYR 9,000.00',
    taxTotal: 'MYR 720.00',
    grandTotal: 'MYR 9,720.00',
    uuid: '7F4B92E1-4921-48C9-A780-B149E0832DE8'
  },

  credit_note: {
    typeKey: 'credit_note',
    code: '02',
    name: 'Credit Note',
    label: 'Credit Note (Adjustment / Rebate)',
    isSelfBilled: false,
    docNumber: 'CN-2026-00045',
    docDate: '10 October 2026',
    currency: 'MYR',
    originalRef: 'INV-2026-00128 (UUID: 7F4B92E1-4921-48C9-A780-B149E0832DE8)',
    issuerTitle: 'Supplier (Issuer)',
    issuerName: 'Dyau Demo Sdn Bhd',
    issuerTIN: 'C25890123010',
    issuerBRN: '202401048899 (1559876-A)',
    issuerSST: 'W10-2401-32000045',
    issuerAddress: 'Level 28, Menara Binjai, No. 2 Jalan Binjai, 50450 Kuala Lumpur',
    counterpartyTitle: 'Buyer (Recipient)',
    counterpartyName: 'Example Trading Sdn Bhd',
    counterpartyTIN: 'C10987654020',
    counterpartyBRN: '201901023456 (1345678-W)',
    counterpartySST: 'W10-1903-21000892',
    counterpartyAddress: 'Suite 12-05, Plaza Mont Kiara, 50480 Kuala Lumpur',
    items: [
      { desc: 'Commercial Volume Discount on Subscription', qty: 1, price: '-1,000.00', taxRate: '8% SST', taxAmt: '-80.00', total: '-1,080.00' }
    ],
    subtotal: 'MYR -1,000.00',
    taxTotal: 'MYR -80.00',
    grandTotal: 'MYR -1,080.00',
    uuid: '8A1C30E4-3312-4B22-B110-C250E1943BA1'
  },

  debit_note: {
    typeKey: 'debit_note',
    code: '03',
    name: 'Debit Note',
    label: 'Debit Note (Supplementary Charge)',
    isSelfBilled: false,
    docNumber: 'DN-2026-00019',
    docDate: '10 October 2026',
    currency: 'MYR',
    originalRef: 'INV-2026-00128 (UUID: 7F4B92E1-4921-48C9-A780-B149E0832DE8)',
    issuerTitle: 'Supplier (Issuer)',
    issuerName: 'Dyau Demo Sdn Bhd',
    issuerTIN: 'C25890123010',
    issuerBRN: '202401048899 (1559876-A)',
    issuerSST: 'W10-2401-32000045',
    issuerAddress: 'Level 28, Menara Binjai, No. 2 Jalan Binjai, 50450 Kuala Lumpur',
    counterpartyTitle: 'Buyer (Recipient)',
    counterpartyName: 'Example Trading Sdn Bhd',
    counterpartyTIN: 'C10987654020',
    counterpartyBRN: '201901023456 (1345678-W)',
    counterpartySST: 'W10-1903-21000892',
    counterpartyAddress: 'Suite 12-05, Plaza Mont Kiara, 50480 Kuala Lumpur',
    items: [
      { desc: 'Additional High-Performance Compute Burst', qty: 5, price: '300.00', taxRate: '8% SST', taxAmt: '120.00', total: '1,620.00' }
    ],
    subtotal: 'MYR 1,500.00',
    taxTotal: 'MYR 120.00',
    grandTotal: 'MYR 1,620.00',
    uuid: '3D9F81B2-1209-4C88-9901-D381F0721EF4'
  },

  refund_note: {
    typeKey: 'refund_note',
    code: '04',
    name: 'Refund Note',
    label: 'Refund Note (Reversal / Reimbursement)',
    isSelfBilled: false,
    docNumber: 'RF-2026-00008',
    docDate: '10 October 2026',
    currency: 'MYR',
    originalRef: 'INV-2026-00128 (UUID: 7F4B92E1-4921-48C9-A780-B149E0832DE8)',
    issuerTitle: 'Supplier (Issuer / Refund Origin)',
    issuerName: 'Dyau Demo Sdn Bhd',
    issuerTIN: 'C25890123010',
    issuerBRN: '202401048899 (1559876-A)',
    issuerSST: 'W10-2401-32000045',
    issuerAddress: 'Level 28, Menara Binjai, No. 2 Jalan Binjai, 50450 Kuala Lumpur',
    counterpartyTitle: 'Buyer (Beneficiary)',
    counterpartyName: 'Example Trading Sdn Bhd',
    counterpartyTIN: 'C10987654020',
    counterpartyBRN: '201901023456 (1345678-W)',
    counterpartySST: 'W10-1903-21000892',
    counterpartyAddress: 'Suite 12-05, Plaza Mont Kiara, 50480 Kuala Lumpur',
    items: [
      { desc: 'Direct Overpayment Settlement Refund', qty: 1, price: '500.00', taxRate: '0% (Exempt)', taxAmt: '0.00', total: '500.00' }
    ],
    subtotal: 'MYR 500.00',
    taxTotal: 'MYR 0.00',
    grandTotal: 'MYR 500.00',
    uuid: '5E2B77A0-9011-4FA3-8822-E902B1842FF7'
  },

  self_billed: {
    typeKey: 'self_billed',
    code: '11',
    name: 'Self-billed Invoice',
    label: 'Self-Billed Invoice (Buyer Issues on Vendor Behalf)',
    isSelfBilled: true,
    docNumber: 'SB-2026-00062',
    docDate: '10 October 2026',
    currency: 'MYR',
    originalRef: 'N/A (Agency / Consignment Settlement)',
    issuerTitle: 'Buyer (Issuer / Payer Entity)',
    issuerName: 'Dyau Demo Sdn Bhd',
    issuerTIN: 'C25890123010',
    issuerBRN: '202401048899 (1559876-A)',
    issuerSST: 'W10-2401-32000045',
    issuerAddress: 'Level 28, Menara Binjai, No. 2 Jalan Binjai, 50450 Kuala Lumpur',
    counterpartyTitle: 'Supplier / Vendor (Payee / Agent)',
    counterpartyName: 'Ahmad Synergy Logistics Ent',
    counterpartyTIN: 'IG30491823010',
    counterpartyBRN: '201803112233 (002891144-P)',
    counterpartySST: 'N/A (Non-Registrant Individual)',
    counterpartyAddress: 'No. 14, Jalan Mewah 3, Taman Mewah, 43000 Kajang, Selangor',
    items: [
      { desc: 'Regional Delivery & Agent Commission Settlement', qty: 1, price: '3,200.00', taxRate: '0% (Exempt E01)', taxAmt: '0.00', total: '3,200.00' },
      { desc: 'Fleet Fuel & Dispatched Handling Reimbursement', qty: 1, price: '800.00', taxRate: '0% (Exempt E01)', taxAmt: '0.00', total: '800.00' }
    ],
    subtotal: 'MYR 4,000.00',
    taxTotal: 'MYR 0.00',
    grandTotal: 'MYR 4,000.00',
    uuid: '9D4C2210-6789-4BB1-8811-A551E0942CC9'
  }
};

// ============================================================================
// DATASET 2: MASTER DATA PARTIES (CUSTOMERS & SUPPLIERS)
// ============================================================================
let partyMasterData = [
  {
    id: 'P-001',
    name: 'Example Trading Sdn Bhd',
    type: 'Customer',
    tin: 'C10987654020',
    brn: '201901023456 (1345678-W)',
    sst: 'W10-1903-21000892',
    msic: '62021 (Software Consulting)',
    email: 'finance@exampletrading.my',
    phone: '+60 3-6201 8899',
    address: 'Suite 12-05, Plaza Mont Kiara, 50480 Kuala Lumpur'
  },
  {
    id: 'P-002',
    name: 'Ahmad Synergy Logistics Ent',
    type: 'Supplier',
    tin: 'IG30491823010',
    brn: '201803112233 (002891144-P)',
    sst: 'N/A (Exempt)',
    msic: '49231 (Freight Transport)',
    email: 'accounts@ahmadlogistics.com',
    phone: '+60 3-8734 5110',
    address: 'No. 14, Jalan Mewah 3, Taman Mewah, 43000 Kajang, Selangor'
  },
  {
    id: 'P-003',
    name: 'Malaya Retail Holdings Bhd',
    type: 'Customer',
    tin: 'C18920194010',
    brn: '201201089211 (9876543-K)',
    sst: 'W10-1205-31000018',
    msic: '47111 (Supermarkets & Retail)',
    email: 'tax@malayaretail.com.my',
    phone: '+60 3-2161 0022',
    address: 'Level 15, Menara IMC, No. 8 Jalan Sultan Ismail, 50250 Kuala Lumpur'
  },
  {
    id: 'P-004',
    name: 'Penang Cloud Systems Sdn Bhd',
    type: 'Supplier',
    tin: 'C22987112020',
    brn: '202101034455 (1420999-D)',
    sst: 'P10-2104-32000077',
    msic: '63111 (Data Hosting & Cloud)',
    email: 'billing@penangcloud.com',
    phone: '+60 4-644 8920',
    address: 'Plot 45, Bayan Lepas Industrial Zone Phase IV, 11900 Bayan Lepas, Penang'
  },
  {
    id: 'P-005',
    name: 'Borneo Supplies Corp Sdn Bhd',
    type: 'Customer',
    tin: 'C15678901010',
    brn: '201701045678 (1248900-M)',
    sst: 'S10-1709-32000033',
    msic: '46591 (Wholesale Hardware)',
    email: 'procurement@borneosupplies.my',
    phone: '+60 82-456 789',
    address: 'Lot 108, Pending Industrial Estate, 93450 Kuching, Sarawak'
  },
  {
    id: 'P-006',
    name: 'Dyau Demo Sdn Bhd (Self / HQ)',
    type: 'Both',
    tin: 'C25890123010',
    brn: '202401048899 (1559876-A)',
    sst: 'W10-2401-32000045',
    msic: '62010 (Computer Programming & AI)',
    email: 'contact@dyau.ai',
    phone: '+60 3-2788 1234',
    address: 'Level 28, Menara Binjai, No. 2 Jalan Binjai, 50450 Kuala Lumpur'
  }
];

// ============================================================================
// DATASET 3: REPORTING DOCUMENTS (RECENT COMPLIANCE LOG)
// ============================================================================
const reportDocumentsData = [
  { docNo: 'INV-2026-00128', type: 'Invoice (01)', customer: 'Example Trading Sdn Bhd', date: '2026-10-10', month: 'October 2026', status: 'Valid', uuid: '7F4B92E1-4921-48C9-A780-B149E0832DE8', amount: 'MYR 9,720.00' },
  { docNo: 'SB-2026-00062', type: 'Self-billed (11)', customer: 'Ahmad Synergy Logistics Ent', date: '2026-10-10', month: 'October 2026', status: 'Valid', uuid: '9D4C2210-6789-4BB1-8811-A551E0942CC9', amount: 'MYR 4,000.00' },
  { docNo: 'INV-2026-00127', type: 'Invoice (01)', customer: 'Malaya Retail Holdings Bhd', date: '2026-10-09', month: 'October 2026', status: 'Valid', uuid: '2C89AA12-9988-4FA1-9011-889900112233', amount: 'MYR 24,500.00' },
  { docNo: 'CN-2026-00045', type: 'Credit Note (02)', customer: 'Example Trading Sdn Bhd', date: '2026-10-08', month: 'October 2026', status: 'Valid', uuid: '8A1C30E4-3312-4B22-B110-C250E1943BA1', amount: 'MYR -1,080.00' },
  { docNo: 'INV-2026-00126', type: 'Invoice (01)', customer: 'Borneo Supplies Corp Sdn Bhd', date: '2026-10-06', month: 'October 2026', status: 'On Hold', uuid: 'HOLD-QUEUED-2026-0019', amount: 'MYR 14,200.00' },
  { docNo: 'DN-2026-00019', type: 'Debit Note (03)', customer: 'Example Trading Sdn Bhd', date: '2026-10-04', month: 'October 2026', status: 'Valid', uuid: '3D9F81B2-1209-4C88-9901-D381F0721EF4', amount: 'MYR 1,620.00' },
  { docNo: 'INV-2026-00125', type: 'Invoice (01)', customer: 'Malaya Retail Holdings Bhd', date: '2026-09-28', month: 'September 2026', status: 'Rejected', uuid: 'REJ-ERR-422-TAX', amount: 'MYR 8,900.00' },
  { docNo: 'RF-2026-00008', type: 'Refund Note (04)', customer: 'Example Trading Sdn Bhd', date: '2026-09-22', month: 'September 2026', status: 'Valid', uuid: '5E2B77A0-9011-4FA3-8822-E902B1842FF7', amount: 'MYR 500.00' },
  { docNo: 'INV-2026-00124', type: 'Invoice (01)', customer: 'Borneo Supplies Corp Sdn Bhd', date: '2026-09-18', month: 'September 2026', status: 'Cancelled', uuid: '7F4B92E1-REVOKED-72H', amount: 'MYR 6,100.00' },
  { docNo: 'SB-2026-00061', type: 'Self-billed (11)', customer: 'Ahmad Synergy Logistics Ent', date: '2026-09-10', month: 'September 2026', status: 'Valid', uuid: '1F99BB34-7766-4AA2-8812-771122334455', amount: 'MYR 3,500.00' },
  { docNo: 'INV-2026-00123', type: 'Invoice (01)', customer: 'Penang Cloud Systems Sdn Bhd', date: '2026-08-25', month: 'August 2026', status: 'Valid', uuid: '4E88DD21-3344-4CC1-9922-665544332211', amount: 'MYR 18,000.00' }
];

// ============================================================================
// STATE CONTROLLERS
// ============================================================================
let currentDocKey = 'invoice';
let currentStep = 1;
let currentOutcome = 'success';
let currentPartyFilter = 'all';

// Outcome explanations
const outcomeDetails = {
  success: {
    statusText: 'Valid',
    bannerClass: 'res-success',
    title: 'LHDN MyInvois Clearance: VALID (Code: 200 OK)',
    message: 'The document passed all 4 layers of validation (schema integrity, arithmetic consistency, tax rate conformity, and registry lookup). Official UUID and QR link generated.'
  },
  hold: {
    statusText: 'On Hold',
    bannerClass: 'res-hold',
    title: 'Platform Notification: ON HOLD (Code: 102 Ingestion Hold)',
    message: 'Buyer Tax Identification Number (TIN) is undergoing regional registration synchronization or requires verification. System queues the invoice for automatic re-trigger without disrupting daily finance work.'
  },
  rejected: {
    statusText: 'Rejected',
    bannerClass: 'res-rejected',
    title: 'Regulatory Validation Exception: REJECTED (Code: 422 Invalid Exemption)',
    message: 'LHDN validation failed on Line Item 2: Tax classification code is incompatible with declared SST rate. Platform pinpoints the exact field for 1-click finance remediation.'
  },
  cancelled: {
    statusText: 'Cancelled',
    bannerClass: 'res-cancelled',
    title: 'Document Withdrawn / Cancelled within 72-Hour Legal Window',
    message: 'The document was formally cancelled by the issuer within the official 72-hour regulatory window. Both buyer and seller accounting ledgers receive cancellation audit receipts.'
  }
};

// ============================================================================
// DOM INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile menu toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });
  }

  // 2. Main Workspace Tab Switching
  initWorkspaceTabs();

  // 3. Tab 1: Live Demo Initializer
  initLiveDemo();

  // 4. Tab 2: Master Data Initializer
  initMasterData();

  // 5. Tab 3: Reporting Dashboard Initializer
  initReportingDashboard();

  // 6. Tab 4: Administration Initializer
  initAdministration();
});

// ============================================================================
// 1. WORKSPACE TABS SWITCHER
// ============================================================================
function initWorkspaceTabs() {
  const tabButtons = document.querySelectorAll('.ws-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-content-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

// ============================================================================
// 2. TAB 1: LIVE DEMO CONTROLLER
// ============================================================================
function initLiveDemo() {
  renderDocType(currentDocKey);
  renderStep(currentStep);
  renderOutcome(currentOutcome);

  // Document Type Buttons
  const docBtns = document.querySelectorAll('.doc-type-btn');
  docBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const typeKey = btn.getAttribute('data-type');
      if (docDatasets[typeKey]) {
        currentDocKey = typeKey;
        docBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderDocType(currentDocKey);
      }
    });
  });

  // Step Proceed Buttons
  document.getElementById('btn-step-1')?.addEventListener('click', () => setStep(2));
  document.getElementById('btn-step-2')?.addEventListener('click', () => setStep(3));
  document.getElementById('btn-step-3')?.addEventListener('click', () => setStep(4));
  document.getElementById('btn-step-4')?.addEventListener('click', () => setStep(5));

  // Stepper Header direct clicking
  const stepperSteps = document.querySelectorAll('.stepper-step');
  stepperSteps.forEach(stepEl => {
    stepEl.addEventListener('click', () => {
      const targetStep = parseInt(stepEl.getAttribute('data-step'), 10);
      setStep(targetStep);
    });
  });

  // Reset Demo Button
  document.getElementById('btn-reset-demo')?.addEventListener('click', () => {
    setStep(1);
    setOutcome('success');
    showToast('Demo reset to Step 1: Data Arrival');
  });

  // Outcome Buttons (Step 5)
  const outcomeBtns = document.querySelectorAll('.outcome-choice-btn');
  outcomeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const outcomeKey = btn.getAttribute('data-outcome');
      setOutcome(outcomeKey);
    });
  });

  // Copy UUID
  document.getElementById('btn-copy-uuid')?.addEventListener('click', () => {
    const doc = docDatasets[currentDocKey];
    if (doc) {
      navigator.clipboard.writeText(doc.uuid).then(() => {
        showToast('UUID copied to clipboard: ' + doc.uuid);
      });
    }
  });

  // QR Click
  document.getElementById('qr-preview-box')?.addEventListener('click', () => {
    const doc = docDatasets[currentDocKey];
    alert(`LHDN Verification Simulation:\n\nUUID: ${doc.uuid}\nDocument No: ${doc.docNumber}\nStatus: Valid\nTimestamp: 10 October 2026, 12:49:58 MYT\nGrand Total: ${doc.grandTotal}\n\n(This QR code is generated for customer demonstration.)`);
  });
}

function renderDocType(typeKey) {
  const doc = docDatasets[typeKey];
  if (!doc) return;

  const natureAlert = document.getElementById('doc-nature-alert');
  if (natureAlert) {
    if (doc.isSelfBilled) {
      natureAlert.className = 'doc-nature-alert self-billed-alert';
      natureAlert.innerHTML = `
        <span style="font-size: 1.2rem;">⚡</span>
        <div>
          <strong>Self-Billed Transaction Mode (Doc Code: 11):</strong> Under Malaysian tax guidelines, the <strong>Buyer acts as Issuer</strong> and generates the e-Invoice on behalf of the Supplier/Payee (e.g., agency commission or agricultural purchases).
        </div>
      `;
    } else {
      natureAlert.className = 'doc-nature-alert';
      natureAlert.innerHTML = `
        <span style="font-size: 1.2rem;">ℹ️</span>
        <div>
          <strong>Standard Commercial Document (Doc Code: ${doc.code}):</strong> The Supplier/Seller generates the document and delivers clearance to the Buyer via LHDN MyInvois.
        </div>
      `;
    }
  }

  updatePayloadViews();
  updateValidatedCard();
  updateOutputsDual();
}

function setStep(stepNum) {
  currentStep = Math.max(1, Math.min(5, stepNum));
  renderStep(currentStep);
  const stage = document.getElementById('step-stage-card');
  if (stage && window.scrollY > 300) {
    stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function renderStep(step) {
  const progressFill = document.getElementById('stepper-progress-fill');
  if (progressFill) {
    const percentages = { 1: '20%', 2: '40%', 3: '60%', 4: '80%', 5: '100%' };
    progressFill.style.width = percentages[step] || '20%';
  }

  const stepperSteps = document.querySelectorAll('.stepper-step');
  stepperSteps.forEach(el => {
    const s = parseInt(el.getAttribute('data-step'), 10);
    el.classList.remove('active', 'completed');
    if (s === step) el.classList.add('active');
    else if (s < step) el.classList.add('completed');
  });

  for (let i = 1; i <= 5; i++) {
    const panel = document.getElementById(`step-panel-${i}`);
    if (panel) {
      panel.style.display = (i === step) ? 'block' : 'none';
    }
  }

  if (step === 5) renderOutcome(currentOutcome);
}

function setOutcome(outcomeKey) {
  if (!outcomeDetails[outcomeKey]) return;
  currentOutcome = outcomeKey;

  const outcomeBtns = document.querySelectorAll('.outcome-choice-btn');
  outcomeBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-outcome') === outcomeKey) {
      btn.classList.add('active');
    }
  });

  renderOutcome(currentOutcome);
}

function renderOutcome(outcomeKey) {
  const detail = outcomeDetails[outcomeKey];
  const doc = docDatasets[currentDocKey];
  if (!detail || !doc) return;

  const banner = document.getElementById('outcome-detail-banner');
  const bannerTitle = document.getElementById('outcome-banner-title');
  const bannerText = document.getElementById('outcome-banner-text');
  const finalOutputArea = document.getElementById('final-output-area');

  if (banner && bannerTitle && bannerText) {
    banner.className = `outcome-detail-banner ${detail.bannerClass}`;
    bannerTitle.textContent = detail.title;
    bannerText.textContent = detail.message;
  }

  if (finalOutputArea) {
    if (outcomeKey === 'success') {
      finalOutputArea.style.display = 'block';
      updateValidatedCard();
      updateOutputsDual();
    } else {
      finalOutputArea.style.display = 'none';
    }
  }
}

function updatePayloadViews() {
  const doc = docDatasets[currentDocKey];
  if (!doc) return;

  const payloadObj = {
    documentHeader: {
      documentType: doc.code,
      documentTypeName: doc.name,
      documentNumber: doc.docNumber,
      issueDate: "2026-10-10T12:49:30Z",
      currencyCode: doc.currency,
      originalReference: doc.originalRef
    },
    supplier: {
      tin: doc.issuerTIN,
      registrationNo: doc.issuerBRN,
      sstRegistration: doc.issuerSST,
      name: doc.issuerName,
      address: doc.issuerAddress
    },
    buyer: {
      tin: doc.counterpartyTIN,
      registrationNo: doc.counterpartyBRN,
      sstRegistration: doc.counterpartySST,
      name: doc.counterpartyName,
      address: doc.counterpartyAddress
    },
    lineItems: doc.items.map((item, idx) => ({
      itemNumber: idx + 1,
      description: item.desc,
      quantity: item.qty,
      unitPrice: parseFloat(item.price.replace(',', '')),
      taxRate: item.taxRate,
      taxAmount: parseFloat(item.taxAmt.replace(',', '')),
      lineTotal: parseFloat(item.total.replace(',', ''))
    })),
    summaryTotals: {
      netSubtotal: doc.subtotal,
      totalTax: doc.taxTotal,
      grandTotal: doc.grandTotal
    }
  };

  const jsonBox = document.getElementById('json-payload-display');
  if (jsonBox) {
    jsonBox.innerHTML = syntaxHighlightJSON(JSON.stringify(payloadObj, null, 2));
  }

  const summaryBox = document.getElementById('summary-grouped-display');
  if (summaryBox) {
    let itemsRows = doc.items.map(it => `
      <div class="summary-field-row">
        <span class="field-label">${it.desc} (x${it.qty})</span>
        <span class="field-val">MYR ${it.total}</span>
      </div>
    `).join('');

    summaryBox.innerHTML = `
      <div class="summary-group">
        <div class="summary-group-title">
          <span>1. Document Header</span>
          <span style="color: var(--color-accent); font-weight: 700;">Doc Code: ${doc.code}</span>
        </div>
        <div class="summary-field-row">
          <span class="field-label">Document Number</span>
          <span class="field-val">${doc.docNumber}</span>
        </div>
        <div class="summary-field-row">
          <span class="field-label">Date & Currency</span>
          <span class="field-val">${doc.docDate} • ${doc.currency}</span>
        </div>
        <div class="summary-field-row">
          <span class="field-label">Reference</span>
          <span class="field-val">${doc.originalRef}</span>
        </div>
      </div>

      <div class="summary-group">
        <div class="summary-group-title">
          <span>2. Parties (${doc.isSelfBilled ? 'Self-Billed' : 'Standard'})</span>
          <span>${doc.isSelfBilled ? 'Buyer Issues' : 'Seller Issues'}</span>
        </div>
        <div class="summary-field-row">
          <span class="field-label">${doc.issuerTitle}</span>
          <span class="field-val">${doc.issuerName}</span>
        </div>
        <div class="summary-field-row">
          <span class="field-label">Issuer TIN / Reg</span>
          <span class="field-val">${doc.issuerTIN}</span>
        </div>
        <div class="summary-field-row">
          <span class="field-label">${doc.counterpartyTitle}</span>
          <span class="field-val">${doc.counterpartyName}</span>
        </div>
        <div class="summary-field-row">
          <span class="field-label">Counterparty TIN</span>
          <span class="field-val">${doc.counterpartyTIN}</span>
        </div>
      </div>

      <div class="summary-group">
        <div class="summary-group-title">
          <span>3. Items & Tax Calculations</span>
          <span>${doc.items.length} Lines</span>
        </div>
        ${itemsRows}
        <div class="summary-field-row" style="margin-top: 6px; border-top: 1px solid var(--color-border); padding-top: 6px;">
          <span class="field-label">Net Subtotal</span>
          <span class="field-val">${doc.subtotal}</span>
        </div>
        <div class="summary-field-row">
          <span class="field-label">Tax Total (SST)</span>
          <span class="field-val">${doc.taxTotal}</span>
        </div>
        <div class="summary-field-row" style="border-top: 2px solid var(--color-primary); padding-top: 6px; font-weight: 800;">
          <span class="field-label" style="color: var(--color-primary);">Grand Total</span>
          <span class="field-val" style="color: var(--color-accent);">${doc.grandTotal}</span>
        </div>
      </div>
    `;
  }

  const storedDocNo = document.getElementById('stored-doc-no');
  const storedDocType = document.getElementById('stored-doc-type');
  const storedTotal = document.getElementById('stored-doc-total');
  if (storedDocNo) storedDocNo.textContent = doc.docNumber;
  if (storedDocType) storedDocType.textContent = `${doc.name} (Code: ${doc.code})`;
  if (storedTotal) storedTotal.textContent = doc.grandTotal;
}

function updateValidatedCard() {
  const doc = docDatasets[currentDocKey];
  if (!doc) return;

  const card = document.getElementById('validated-invoice-card');
  if (card) {
    if (doc.isSelfBilled) card.classList.add('self-billed-variant');
    else card.classList.remove('self-billed-variant');
  }

  const valCardTitle = document.getElementById('val-card-title');
  const valDocTypePill = document.getElementById('val-doc-type-pill');
  const valUUID = document.getElementById('val-uuid-display');
  const valDocNo = document.getElementById('val-doc-no');
  const valGrandTotal = document.getElementById('val-grand-total');

  if (valCardTitle) valCardTitle.textContent = `Validated e-Invoice: ${doc.docNumber}`;
  if (valDocTypePill) {
    valDocTypePill.textContent = doc.isSelfBilled ? 'Self-Billed Validated (11)' : `LHDN Validated (${doc.code})`;
    if (doc.isSelfBilled) valDocTypePill.classList.add('self-billed-pill');
    else valDocTypePill.classList.remove('self-billed-pill');
  }
  if (valUUID) valUUID.textContent = doc.uuid;
  if (valDocNo) valDocNo.textContent = doc.docNumber;
  if (valGrandTotal) valGrandTotal.textContent = doc.grandTotal;

  const valTableBody = document.getElementById('val-table-body');
  if (valTableBody) {
    valTableBody.innerHTML = doc.items.map(it => `
      <tr>
        <td><strong>${it.desc}</strong></td>
        <td class="text-right">${it.qty}</td>
        <td class="text-right">${it.price}</td>
        <td class="text-right">${it.taxRate}</td>
        <td class="text-right" style="font-weight: 700;">${it.total}</td>
      </tr>
    `).join('');
  }

  const valSubtotal = document.getElementById('val-subtotal');
  const valTax = document.getElementById('val-tax');
  const valFinalTotal = document.getElementById('val-final-total');
  if (valSubtotal) valSubtotal.textContent = doc.subtotal;
  if (valTax) valTax.textContent = doc.taxTotal;
  if (valFinalTotal) valFinalTotal.textContent = doc.grandTotal;
}

function updateOutputsDual() {
  const doc = docDatasets[currentDocKey];
  if (!doc) return;

  const restApiResponse = {
    statusCode: 200,
    status: "Valid",
    message: "Document successfully cleared and registered with LHDN MyInvois",
    data: {
      uuid: doc.uuid,
      submissionUid: "SUB-20261010-008914",
      documentType: doc.code,
      documentNumber: doc.docNumber,
      validationDateTime: "2026-10-10T12:49:58+08:00",
      totalPayable: doc.grandTotal,
      taxPayerTIN: doc.issuerTIN,
      qrVerificationUrl: `https://myinvois.hasil.gov.my/verify/${doc.uuid}`,
      auditDigest: "SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
  };

  const restBox = document.getElementById('rest-api-response-display');
  if (restBox) {
    restBox.innerHTML = syntaxHighlightJSON(JSON.stringify(restApiResponse, null, 2));
  }

  const batchCsv = [
    `# Dyau.ai LHDN Clearance Batch Reconciliation File`,
    `# Generated: 2026-10-10 12:50:00 MYT | BatchID: BATCH-MYINV-2026-10-10-0941`,
    `DOC_TYPE,DOC_NUM,ORIGINAL_REF,UUID,STATUS,LHDN_TIMESTAMP,AMOUNT_MYR,REMARKS`,
    `${doc.code},"${doc.docNumber}","${doc.originalRef}","${doc.uuid}","Valid","2026-10-10 12:49:58","${doc.grandTotal}","CLEARANCE_SUCCESS"`
  ].join('\n');

  const batchBox = document.getElementById('batch-output-display');
  if (batchBox) {
    batchBox.textContent = batchCsv;
  }
}

// ============================================================================
// 3. TAB 2: MASTER DATA – CUSTOMER / PARTY MANAGEMENT
// ============================================================================
function initMasterData() {
  renderPartyTable();

  // Search filter
  const searchInput = document.getElementById('party-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderPartyTable();
    });
  }

  // Filter chips (All, Customer, Supplier)
  const filterChips = document.querySelectorAll('.party-filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentPartyFilter = chip.getAttribute('data-filter');
      renderPartyTable();
    });
  });

  // Modal open for "+ New Party Record"
  document.getElementById('btn-add-party')?.addEventListener('click', () => {
    openPartyModal(null);
  });

  // Modal close
  document.getElementById('btn-close-party-modal')?.addEventListener('click', closePartyModal);
  document.getElementById('party-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'party-modal-overlay') closePartyModal();
  });

  // Modal form submit
  document.getElementById('party-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('party-id-hidden').value;
    const name = document.getElementById('party-name-input').value;
    const type = document.getElementById('party-type-input').value;
    const tin = document.getElementById('party-tin-input').value;
    const brn = document.getElementById('party-brn-input').value;
    const sst = document.getElementById('party-sst-input').value || 'N/A';
    const email = document.getElementById('party-email-input').value;
    const phone = document.getElementById('party-phone-input').value;
    const address = document.getElementById('party-address-input').value;

    if (id) {
      // Edit existing
      const p = partyMasterData.find(item => item.id === id);
      if (p) {
        p.name = name;
        p.type = type;
        p.tin = tin;
        p.brn = brn;
        p.sst = sst;
        p.email = email;
        p.phone = phone;
        p.address = address;
      }
      showToast('Party master record updated successfully!');
    } else {
      // Add new
      const newId = `P-00${partyMasterData.length + 1}`;
      partyMasterData.unshift({
        id: newId,
        name,
        type,
        tin,
        brn,
        sst,
        msic: '62010 (IT Services)',
        email,
        phone,
        address
      });
      showToast('New party master record registered!');
    }

    closePartyModal();
    renderPartyTable();
  });
}

function renderPartyTable() {
  const tbody = document.getElementById('party-table-body');
  if (!tbody) return;

  const query = (document.getElementById('party-search-input')?.value || '').toLowerCase().trim();

  let filtered = partyMasterData.filter(p => {
    // Type filter
    if (currentPartyFilter === 'Customer' && p.type !== 'Customer' && p.type !== 'Both') return false;
    if (currentPartyFilter === 'Supplier' && p.type !== 'Supplier' && p.type !== 'Both') return false;
    // Search query
    if (query) {
      const match = p.name.toLowerCase().includes(query) ||
                    p.tin.toLowerCase().includes(query) ||
                    p.brn.toLowerCase().includes(query) ||
                    p.email.toLowerCase().includes(query);
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 32px; color: var(--color-muted);">No matching party master records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    let badgeClass = 'party-badge-customer';
    if (p.type === 'Supplier') badgeClass = 'party-badge-supplier';
    if (p.type === 'Both') badgeClass = 'party-badge-both';

    return `
      <tr>
        <td class="party-name-cell">
          <strong>${p.name}</strong>
          <small>${p.id} • ${p.email}</small>
        </td>
        <td>
          <span class="${badgeClass}">${p.type}</span>
        </td>
        <td>
          <code style="font-weight: 700; color: var(--color-primary);">${p.tin}</code>
        </td>
        <td>
          <span style="font-size: 0.82rem; color: var(--color-heading); font-weight: 600;">${p.brn}</span>
        </td>
        <td>
          <span style="font-size: 0.82rem; color: var(--color-body);">${p.sst}</span>
        </td>
        <td style="text-align: right;">
          <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.78rem;" onclick="viewPartyDetails('${p.id}')">View</button>
          <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.78rem;" onclick="editPartyRecord('${p.id}')">Edit</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.viewPartyDetails = function(partyId) {
  const p = partyMasterData.find(item => item.id === partyId);
  if (!p) return;
  alert(`Party Master Profile:\n\nEntity Name: ${p.name}\nParty Role: ${p.type}\nTIN (Tax ID): ${p.tin}\nBRN (Reg No): ${p.brn}\nSST ID: ${p.sst}\nMSIC Activity: ${p.msic}\nContact Email: ${p.email}\nPhone: ${p.phone}\nRegistered Address:\n${p.address}`);
};

window.editPartyRecord = function(partyId) {
  const p = partyMasterData.find(item => item.id === partyId);
  if (p) openPartyModal(p);
};

function openPartyModal(party) {
  const modal = document.getElementById('party-modal-overlay');
  const title = document.getElementById('party-modal-title');
  if (!modal) return;

  if (party) {
    title.textContent = `Edit Party Master: ${party.name}`;
    document.getElementById('party-id-hidden').value = party.id;
    document.getElementById('party-name-input').value = party.name;
    document.getElementById('party-type-input').value = party.type;
    document.getElementById('party-tin-input').value = party.tin;
    document.getElementById('party-brn-input').value = party.brn;
    document.getElementById('party-sst-input').value = party.sst;
    document.getElementById('party-email-input').value = party.email;
    document.getElementById('party-phone-input').value = party.phone;
    document.getElementById('party-address-input').value = party.address;
  } else {
    title.textContent = 'Register New Customer / Supplier Party';
    document.getElementById('party-form').reset();
    document.getElementById('party-id-hidden').value = '';
  }

  modal.classList.add('active');
}

function closePartyModal() {
  document.getElementById('party-modal-overlay')?.classList.remove('active');
}

// ============================================================================
// 4. TAB 3: REPORTING DASHBOARD CONTROLLER
// ============================================================================
function initReportingDashboard() {
  populateReportFilters();
  renderReportTable();

  // Apply filters button
  document.getElementById('btn-apply-filters')?.addEventListener('click', () => {
    renderReportTable();
    showToast('Report filtered successfully!');
  });

  // Reset filters button
  document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
    document.getElementById('filter-month-select').value = 'all';
    document.getElementById('filter-customer-select').value = 'all';
    document.getElementById('filter-status-select').value = 'all';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    renderReportTable();
    showToast('Filters cleared.');
  });
}

function populateReportFilters() {
  const customerSelect = document.getElementById('filter-customer-select');
  if (customerSelect) {
    const customers = [...new Set(reportDocumentsData.map(d => d.customer))];
    customers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      customerSelect.appendChild(opt);
    });
  }
}

function renderReportTable() {
  const tbody = document.getElementById('report-table-body');
  if (!tbody) return;

  const monthVal = document.getElementById('filter-month-select')?.value || 'all';
  const custVal = document.getElementById('filter-customer-select')?.value || 'all';
  const statusVal = document.getElementById('filter-status-select')?.value || 'all';
  const dateFrom = document.getElementById('filter-date-from')?.value;
  const dateTo = document.getElementById('filter-date-to')?.value;

  let filtered = reportDocumentsData.filter(d => {
    if (monthVal !== 'all' && d.month !== monthVal) return false;
    if (custVal !== 'all' && d.customer !== custVal) return false;
    if (statusVal !== 'all' && d.status !== statusVal) return false;
    if (dateFrom && d.date < dateFrom) return false;
    if (dateTo && d.date > dateTo) return false;
    return true;
  });

  // Update dynamic metric totals
  const totalCount = filtered.length;
  const validCount = filtered.filter(d => d.status === 'Valid').length;
  const holdCount = filtered.filter(d => d.status === 'On Hold').length;
  const rejCount = filtered.filter(d => d.status === 'Rejected').length;
  const cancelCount = filtered.filter(d => d.status === 'Cancelled').length;
  const selfBilledCount = filtered.filter(d => d.type.includes('Self-billed')).length;
  const normalCount = totalCount - selfBilledCount;

  document.getElementById('kpi-total-val').textContent = totalCount;
  document.getElementById('kpi-valid-val').textContent = validCount;
  document.getElementById('kpi-hold-val').textContent = holdCount;
  document.getElementById('kpi-rejected-val').textContent = rejCount;
  document.getElementById('kpi-cancelled-val').textContent = cancelCount;
  document.getElementById('kpi-selfbilled-val').textContent = `${selfBilledCount} / ${normalCount}`;

  // Update visual breakdown bar percentages
  const validPct = totalCount > 0 ? (validCount / totalCount) * 100 : 0;
  const holdPct = totalCount > 0 ? (holdCount / totalCount) * 100 : 0;
  const rejPct = totalCount > 0 ? (rejCount / totalCount) * 100 : 0;
  const cancelPct = totalCount > 0 ? (cancelCount / totalCount) * 100 : 0;

  const barValid = document.getElementById('bar-seg-valid');
  const barHold = document.getElementById('bar-seg-hold');
  const barRej = document.getElementById('bar-seg-rejected');
  const barCancel = document.getElementById('bar-seg-cancelled');

  if (barValid) barValid.style.width = `${validPct}%`;
  if (barHold) barHold.style.width = `${holdPct}%`;
  if (barRej) barRej.style.width = `${rejPct}%`;
  if (barCancel) barCancel.style.width = `${cancelPct}%`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 32px; color: var(--color-muted);">No documents match the specified filter criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(d => {
    let tagClass = 'tag-valid';
    if (d.status === 'On Hold') tagClass = 'tag-hold';
    if (d.status === 'Rejected') tagClass = 'tag-rejected';
    if (d.status === 'Cancelled') tagClass = 'tag-cancelled';

    return `
      <tr>
        <td style="font-weight: 700; color: var(--color-primary);">${d.docNo}</td>
        <td>${d.type}</td>
        <td><strong>${d.customer}</strong></td>
        <td>${d.date}</td>
        <td><span class="status-indicator-tag ${tagClass}">● ${d.status}</span></td>
        <td><code style="font-size: 0.76rem; background: var(--bg-muted); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--color-border);">${d.uuid}</code></td>
        <td style="text-align: right; font-weight: 700; color: var(--color-heading);">${d.amount}</td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// 5. TAB 4: ADMINISTRATION CONTROLLER
// ============================================================================
function initAdministration() {
  const toggles = document.querySelectorAll('.config-switch-input');
  toggles.forEach(t => {
    t.addEventListener('change', () => {
      showToast(`Configuration updated: ${t.getAttribute('data-config')} is now ${t.checked ? 'ENABLED' : 'DISABLED'}`);
    });
  });
}

// ============================================================================
// UTILITIES
// ============================================================================
function syntaxHighlightJSON(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'json-num';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'json-key';
      } else {
        cls = 'json-str';
      }
    } else if (/true|false/.test(match)) {
      cls = 'json-bool';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

function showToast(message) {
  let toast = document.getElementById('demo-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'demo-toast';
    toast.className = 'demo-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}
