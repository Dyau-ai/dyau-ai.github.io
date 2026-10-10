/**
 * Dyau.ai - Malaysia e-Invoicing Interactive Demonstration Engine
 * Pure vanilla JavaScript driving the End-to-End Live Demo.
 */

// Dataset for all 5 document types
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

// State variables
let currentDocKey = 'invoice';
let currentStep = 1;
let currentOutcome = 'success'; // 'success' | 'hold' | 'rejected' | 'cancelled'

// Outcome details map
const outcomeDetails = {
  success: {
    statusText: 'Valid',
    bannerClass: 'res-success',
    pillClass: 'val-official-pill',
    title: 'LHDN MyInvois Clearance: VALID (Code: 200 OK)',
    message: 'The document passed all 4 layers of validation (schema integrity, arithmetic consistency, tax rate conformity, and registry lookup). Official UUID and QR link generated.',
    uuidDesc: 'Official Government Cleared UUID'
  },
  hold: {
    statusText: 'On Hold',
    bannerClass: 'res-hold',
    pillClass: 'val-official-pill',
    title: 'Platform Notification: ON HOLD (Code: 102 Ingestion Hold)',
    message: 'Buyer Tax Identification Number (TIN) is undergoing regional registration synchronization or requires verification. System queues the invoice for automatic re-trigger without disrupting daily finance work.',
    uuidDesc: 'UUID Pending (Held in Gateway Queue)'
  },
  rejected: {
    statusText: 'Rejected',
    bannerClass: 'res-rejected',
    pillClass: 'val-official-pill',
    title: 'Regulatory Validation Exception: REJECTED (Code: 422 Invalid Exemption)',
    message: 'LHDN validation failed on Line Item 2: Tax classification code is incompatible with declared SST rate. Platform pinpoints the exact field for 1-click finance remediation.',
    uuidDesc: 'Not Issued (Rejection Record)'
  },
  cancelled: {
    statusText: 'Cancelled',
    bannerClass: 'res-cancelled',
    pillClass: 'val-official-pill',
    title: 'Document Withdrawn / Cancelled within 72-Hour Legal Window',
    message: 'The document was formally cancelled by the issuer within the official 72-hour regulatory window. Both buyer and seller accounting ledgers receive cancellation audit receipts.',
    uuidDesc: 'UUID Revoked (Cancelled Status)'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });
  }

  // Init UI
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
        // Refresh outputs
        updatePayloadViews();
        updateValidatedCard();
        updateOutputsDual();
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
});

// Switch Document Type
function renderDocType(typeKey) {
  const doc = docDatasets[typeKey];
  if (!doc) return;

  // Notice alert banner update
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

  // Update Payload views
  updatePayloadViews();
  // Update Validated Invoice Card
  updateValidatedCard();
  // Update Outputs
  updateOutputsDual();
}

// Step Handling
function setStep(stepNum) {
  currentStep = Math.max(1, Math.min(5, stepNum));
  renderStep(currentStep);
  // Auto scroll to step stage
  const stage = document.getElementById('step-stage-card');
  if (stage && window.scrollY > 300) {
    stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function renderStep(step) {
  // Update progress bar
  const progressFill = document.getElementById('stepper-progress-fill');
  if (progressFill) {
    const percentages = { 1: '20%', 2: '40%', 3: '60%', 4: '80%', 5: '100%' };
    progressFill.style.width = percentages[step] || '20%';
  }

  // Update step circles
  const stepperSteps = document.querySelectorAll('.stepper-step');
  stepperSteps.forEach(el => {
    const s = parseInt(el.getAttribute('data-step'), 10);
    el.classList.remove('active', 'completed');
    if (s === step) {
      el.classList.add('active');
    } else if (s < step) {
      el.classList.add('completed');
    }
  });

  // Toggle step containers
  for (let i = 1; i <= 5; i++) {
    const panel = document.getElementById(`step-panel-${i}`);
    if (panel) {
      panel.style.display = (i === step) ? 'block' : 'none';
    }
  }

  // If on step 5, render outcome view
  if (step === 5) {
    renderOutcome(currentOutcome);
  }
}

// Outcome Handling
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

  // Outcome banner update
  const banner = document.getElementById('outcome-detail-banner');
  const bannerTitle = document.getElementById('outcome-banner-title');
  const bannerText = document.getElementById('outcome-banner-text');
  const finalOutputArea = document.getElementById('final-output-area');

  if (banner && bannerTitle && bannerText) {
    banner.className = `outcome-detail-banner ${detail.bannerClass}`;
    bannerTitle.textContent = detail.title;
    bannerText.textContent = detail.message;
  }

  // Only show final e-Invoice and API outputs when SUCCESS is active
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

// Update JSON payload & grouped fields in Step 1
function updatePayloadViews() {
  const doc = docDatasets[currentDocKey];
  if (!doc) return;

  // 1. JSON Payload formatting
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

  // 2. Summary Grouped View
  const summaryBox = document.getElementById('summary-grouped-display');
  if (summaryBox) {
    let itemsRows = doc.items.map(it => `
      <div class="summary-field-row">
        <span class="field-label">${it.desc} (x${it.qty})</span>
        <span class="field-val">MYR ${it.total}</span>
      </div>
    `).join('');

    summaryBox.innerHTML = `
      <!-- Header -->
      <div class="summary-group">
        <div class="summary-group-title">
          <span>1. Document Header</span>
          <span style="color: var(--teal-600);">Doc Code: ${doc.code}</span>
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

      <!-- Parties -->
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

      <!-- Line Items & Tax -->
      <div class="summary-group">
        <div class="summary-group-title">
          <span>3. Items & Tax Calculations</span>
          <span>${doc.items.length} Lines</span>
        </div>
        ${itemsRows}
        <div class="summary-field-row" style="margin-top: 6px; border-top: 1px solid var(--border-light); padding-top: 6px;">
          <span class="field-label">Net Subtotal</span>
          <span class="field-val">${doc.subtotal}</span>
        </div>
        <div class="summary-field-row">
          <span class="field-label">Tax Total (SST)</span>
          <span class="field-val">${doc.taxTotal}</span>
        </div>
        <div class="summary-field-row" style="border-top: 2px solid var(--navy-900); padding-top: 6px; font-weight: 700;">
          <span class="field-label" style="color: var(--navy-900);">Grand Total</span>
          <span class="field-val" style="color: var(--teal-600);">${doc.grandTotal}</span>
        </div>
      </div>
    `;
  }

  // Update step 2 intake confirmation text
  const storedDocNo = document.getElementById('stored-doc-no');
  const storedDocType = document.getElementById('stored-doc-type');
  const storedTotal = document.getElementById('stored-doc-total');
  if (storedDocNo) storedDocNo.textContent = doc.docNumber;
  if (storedDocType) storedDocType.textContent = `${doc.name} (Code: ${doc.code})`;
  if (storedTotal) storedTotal.textContent = doc.grandTotal;
}

// Update Validated Card Preview in Step 6
function updateValidatedCard() {
  const doc = docDatasets[currentDocKey];
  if (!doc) return;

  const card = document.getElementById('validated-invoice-card');
  if (card) {
    if (doc.isSelfBilled) {
      card.classList.add('self-billed-variant');
    } else {
      card.classList.remove('self-billed-variant');
    }
  }

  const valCardTitle = document.getElementById('val-card-title');
  const valDocTypePill = document.getElementById('val-doc-type-pill');
  const valUUID = document.getElementById('val-uuid-display');
  const valDocNo = document.getElementById('val-doc-no');
  const valGrandTotal = document.getElementById('val-grand-total');

  if (valCardTitle) valCardTitle.textContent = `Validated e-Invoice: ${doc.docNumber}`;
  if (valDocTypePill) {
    valDocTypePill.textContent = doc.isSelfBilled ? 'Self-Billed Validated (11)' : `LHDN Validated (${doc.code})`;
    if (doc.isSelfBilled) {
      valDocTypePill.classList.add('self-billed-pill');
    } else {
      valDocTypePill.classList.remove('self-billed-pill');
    }
  }
  if (valUUID) valUUID.textContent = doc.uuid;
  if (valDocNo) valDocNo.textContent = doc.docNumber;
  if (valGrandTotal) valGrandTotal.textContent = doc.grandTotal;

  // Table rows in validated card
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

  // Totals in validated card
  const valSubtotal = document.getElementById('val-subtotal');
  const valTax = document.getElementById('val-tax');
  const valFinalTotal = document.getElementById('val-final-total');
  if (valSubtotal) valSubtotal.textContent = doc.subtotal;
  if (valTax) valTax.textContent = doc.taxTotal;
  if (valFinalTotal) valFinalTotal.textContent = doc.grandTotal;
}

// Update Side-by-Side Outputs (REST API Response & Batch File)
function updateOutputsDual() {
  const doc = docDatasets[currentDocKey];
  if (!doc) return;

  // 1. Simulated REST API Response (JSON)
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

  // 2. Simulated Batch File Output (CSV / Delimited)
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

// JSON syntax highlighter
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

// Toast helper
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
