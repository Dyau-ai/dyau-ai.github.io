/**
 * Dyau.ai - Malaysia e-Invoicing Interactive SaaS Platform Engine
 * Enhanced with 18 Statutory & Operational Business Logics (HR-01 to HR-18)
 * 
 * Includes:
 * 1. Business Logics Catalogue & Modal Inspector (18 Rules across 4 Categories)
 * 2. Interactive Simulation Toolbox Controls (Threshold, 72h Window, SVDP, Group Carve-Out)
 * 3. 4 Main Workspace Tabs (Live Demo, Master Data, Reporting Dashboard, Administration)
 * 4. Dual REST API & Batch Reconciliation Outputs
 */

// ============================================================================
// REGULATORY & OPERATIONAL BUSINESS LOGICS CATALOGUE (HR-01 to HR-18)
// ============================================================================
const businessLogicsData = {
  'HR-01': {
    code: 'HR-01',
    name: 'Mandatory Implementation Phasing',
    category: 'Regulatory Timing',
    statutoryRef: 'IRBM Guidelines v2.8 (Section 1.5) & Finance Act 2023',
    summary: 'Rollout is mandated across 4 phases based on annual turnover: Phase 1 (>RM100M, 1 Aug 2024), Phase 2 (RM25M–RM100M, 1 Jan 2025), Phase 3 (RM3M–RM25M, 1 Jul 2025), Phase 4 (All remaining taxpayers mandated from 1 Jan 2026 / 1 Jul 2025).',
    enforcement: 'Platform dynamically identifies taxpayer statutory phase based on historical revenue baseline and locks required schema versions.',
    demoImpact: 'Visible in Workspace Header ("Phase 3 Mandated"). Dyau.ai validates transaction timing against active compliance dates.'
  },
  'HR-02': {
    code: 'HR-02',
    name: 'Annual Turnover Exemption Threshold (RM3 Million)',
    category: 'Exemption Scope',
    statutoryRef: 'LHDN Policy Circular (Revised June 2025) & Budget 2025 Announcement',
    summary: 'Taxpayers with annual turnover or revenue under RM3 Million are legally exempted from mandatory issuance of individual e-Invoices (threshold raised from RM1 Million to RM3 Million).',
    enforcement: 'Automated revenue audit determines whether individual transmission or general consolidation is permissible.',
    demoImpact: 'Simulation Toolbox lets you toggle between Mandated Enterprise (>RM3M) and SME Exemption (<RM3M).'
  },
  'HR-03': {
    code: 'HR-03',
    name: 'Related-Party & Group Carve-Out Rule',
    category: 'Anti-Avoidance',
    statutoryRef: 'IRBM General e-Invoicing Guidelines v2.8 (Section 1.6)',
    summary: 'The RM3 Million exemption does NOT apply if an entity is part of a corporate group or related-party network where aggregate group turnover or a related entity exceeds RM3 Million.',
    enforcement: 'Corporate structure and Ultimate Beneficial Ownership (UBO) lookup overrides SME exemption flag to enforce compliance.',
    demoImpact: 'Test the "Group Carve-Out" toggle in the Simulation Toolbox: subsidiary turnover of RM1.8M is denied exemption because parent group turnover is RM45M!'
  },
  'HR-04': {
    code: 'HR-04',
    name: '72.0-Hour Statutory Cancellation / Rejection Window',
    category: 'Lifecycle & Legal Status',
    statutoryRef: 'Section 82C Income Tax Act 1967 & MyInvois SDK API Specification',
    summary: 'An e-Invoice can only be cancelled by the issuer or rejected by the buyer within exactly 72.0 hours from validation timestamp. After 72 hours, cancellation API returns HTTP 400 Bad Request; legal adjustment requires a linked Credit Note (Doc Code: 02).',
    enforcement: 'Hard timer lock in Dyau.ai. Cancellation requests submitted after 72.0 hours are automatically blocked, prompting the user to generate a linked Credit Note.',
    demoImpact: 'Toggle between "Within Window (24.5 hrs)" and "Expired Window (78.2 hrs)" in the Simulation Toolbox to see the live lock and Credit Note redirect.'
  },
  'HR-05': {
    code: 'HR-05',
    name: '7-Year Statutory Record Retention',
    category: 'Audit & Compliance',
    statutoryRef: 'Section 82 Income Tax Act 1967',
    summary: 'All validated e-Invoices, cryptographic proof (UUID, XML/JSON canonical hashes, LHDN timestamps, digital signatures) must be stored securely for a minimum of 7 statutory years.',
    enforcement: 'WORM (Write Once Read Many) compliant immutable cloud archive with automatic retention policy lock.',
    demoImpact: 'Highlighted in Tab 4 Administration: 7-Year Retention Audit Vault status is active and locked against premature deletion.'
  },
  'HR-06': {
    code: 'HR-06',
    name: 'Out-of-Scope Transactions Filter',
    category: 'Transaction Scope',
    statutoryRef: 'IRBM Specific Guidelines v2.8 (Section 3)',
    summary: 'Transactions strictly excluded from e-Invoicing include: employment income (salaries, wages), director fees, dividends declared, zakat payments, and sovereign inter-governmental transfers.',
    enforcement: 'Pre-flight screening filters out-of-scope transactions from the e-Invoice transmission queue to avoid cluttering LHDN pipelines.',
    demoImpact: 'Verified in Stage 3 Platform Checks: Transaction type is screened against the ITA Out-of-Scope whitelist.'
  },
  'HR-07': {
    code: 'HR-07',
    name: 'RM10,000 Single-Transaction Threshold',
    category: 'Threshold & Consolidation',
    statutoryRef: 'IRBM Directive on Consolidated e-Invoicing (Effective 1 Jan 2026)',
    summary: 'Any single B2C sale or retail transaction exceeding RM10,000 CANNOT be consolidated into a monthly summary invoice. An individual e-Invoice must be issued and cleared by LHDN for that buyer, even if the buyer does not request it.',
    enforcement: 'Platform parser evaluates TotalPayable. If amount > RM10,000, consolidation flag is permanently locked and individual transmission is enforced.',
    demoImpact: 'Switch the Simulation Toolbox to "High-Value (RM15,120)": the demo immediately flags HR-07 and disables monthly consolidation!'
  },
  'HR-08': {
    code: 'HR-08',
    name: 'Sector-Specific Consolidation Prohibition',
    category: 'Sector Compliance',
    statutoryRef: 'IRBM Specific Guidelines (Section 3.8)',
    summary: 'Consolidated e-Invoicing is prohibited for specific industries regardless of amount: Motor vehicle sales, commercial flight tickets, construction contracts, and luxury goods/agent payouts must always have individual e-Invoices.',
    enforcement: 'MSIC code screening blocks consolidation flag for designated restricted industry categories.',
    demoImpact: 'Highlighted in Tab 3 Reporting Dashboard filter options and Master Data MSIC classifications.'
  },
  'HR-09': {
    code: 'HR-09',
    name: 'Monthly B2C Consolidation Timing (7-Day Rule)',
    category: 'Consolidation Deadline',
    statutoryRef: 'IRBM Guidelines v2.8 (Section 3.7.2)',
    summary: 'For eligible retail transactions (<RM10,000 where buyer did not request an individual invoice), consolidated e-Invoices must be submitted to LHDN within 7 calendar days after the close of the transaction month.',
    enforcement: 'Automated month-end batch aggregation triggers compilation on Day 1-5 and hard submission before Day 7 23:59 MYT.',
    demoImpact: 'Displayed in Tab 3 Reporting Dashboard: Monthly Consolidation countdown indicator tracks the 7-day post-month-end deadline.'
  },
  'HR-10': {
    code: 'HR-10',
    name: 'Phase 4 Interim Relaxation Threshold',
    category: 'Transition Policy',
    statutoryRef: 'Ministry of Finance Transition Order (through 31 Dec 2027)',
    summary: 'Taxpayers with annual turnover under RM5 Million are granted an interim concession allowing simplified descriptions and consolidated summary submissions through 31 December 2027.',
    enforcement: 'Dyau.ai automatically adapts line item schema validation based on taxpayer transition tier.',
    demoImpact: 'Integrated in Stage 3 validation rules and Platform settings.'
  },
  'HR-11': {
    code: 'HR-11',
    name: 'Self-Billed Trigger Rules (Doc Code: 11)',
    category: 'Self-Billed Invoicing',
    statutoryRef: 'IRBM Guidelines v2.8 (Section 8)',
    summary: 'Self-billed invoices must be issued by the Buyer (acting as Issuer) in specific scenarios: payments to foreign suppliers without Malaysian TIN, agent/distributor commission payouts, individual freelance service providers, and betting/gaming payouts.',
    enforcement: 'Party relationship type triggers automatic swap to Document Type 11 (Self-billed).',
    demoImpact: 'Click "Self-billed Invoice (11)" in the Document Type selector: notice how Dyau Demo Sdn Bhd becomes the Issuer (Buyer) while Ahmad Logistics is the Vendor!'
  },
  'HR-12': {
    code: 'HR-12',
    name: 'Self-Billed Role Reversal & HSM Signature',
    category: 'Digital Signature & Identity',
    statutoryRef: 'IRBM e-Invoicing Technical SDK (Section 4.3)',
    summary: 'In a Self-Billed invoice, the buyer signs the XML/JSON payload using their own enterprise X.509 HSM digital certificate and submits directly to LHDN, assuming primary tax reporting liability.',
    enforcement: 'Automated cryptographic signing switches keypair from Seller certificate to Buyer enterprise certificate.',
    demoImpact: 'Visible in Stage 4 Submission payload: Buyer TIN C25890123010 is attached as the Digital Signer.'
  },
  'HR-13': {
    code: 'HR-13',
    name: 'Standard General Tax Identification Numbers (TINs)',
    category: 'Master Data & Identity',
    statutoryRef: 'IRBM e-Invoicing Guidelines Appendix 1',
    summary: 'Mandatory standard TINs must be used when individual TIN is unavailable: EI00000000010 (Consolidated B2C Malaysian resident), EI00000000020 (Foreign Buyer non-resident), EI00000000030 (Foreign Supplier non-resident), EI00000000040 (Federal/State Government entity).',
    enforcement: 'Master Data engine validates TIN format and defaults to statutory standard TINs for foreign or consolidated parties.',
    demoImpact: 'Reference table and auto-fill buttons in Tab 2 Master Data and Stage 1 JSON payload.'
  },
  'HR-14': {
    code: 'HR-14',
    name: 'Mandatory Original UUID Linkage for Adjustments',
    category: 'Data Integrity',
    statutoryRef: 'IRBM SDK Specification (Document Adjustments)',
    summary: 'Every Credit Note (02), Debit Note (03), or Refund Note (04) must provide the exact government-cleared UUID of the original validated invoice in the OriginalDocumentReference field.',
    enforcement: 'Platform validation rejects any adjustment document lacking a valid 36-character hexadecimal UUID of an active, validated base document.',
    demoImpact: 'Select Credit Note (02) or Debit Note (03): see the original UUID 7F4B92E1-4921-48C9-A780-B149E0832DE8 automatically bound and validated!'
  },
  'HR-15': {
    code: 'HR-15',
    name: 'Prohibition Against Adjusting Cancelled Documents',
    category: 'Integrity Rule',
    statutoryRef: 'IRBM Guidelines v2.8 (Section 2.4)',
    summary: 'A Credit Note or Debit Note CANNOT be issued against an invoice that has been cancelled or rejected by LHDN. Adjustments are only valid against invoices in "Valid" status.',
    enforcement: 'Document status lookup prevents generating adjustment references against cancelled UUID records.',
    demoImpact: 'Tested when selecting Cancelled scenario in Step 5: status is flagged non-adjustable.'
  },
  'HR-16': {
    code: 'HR-16',
    name: 'Buyer Same-Calendar-Month Request Window',
    category: 'B2C Transition',
    statutoryRef: 'IRBM Guidelines v2.8 (Section 3.7.1)',
    summary: 'A retail buyer who initially received a normal receipt has until the last day of the same calendar month to request a formal validated e-Invoice from the seller.',
    enforcement: 'Point-of-Sale (POS) integration tracks issuance date and disables retroactive e-Invoice requests past the calendar month boundary.',
    demoImpact: 'Shown in Reporting Dashboard and retail transaction filters.'
  },
  'HR-17': {
    code: 'HR-17',
    name: 'Special Voluntary Disclosure Programme (SVDP 1.2/1.3)',
    category: 'Compliance Amnesty',
    statutoryRef: 'LHDN SVDP Circular 2024–2027 (Section 4.1)',
    summary: 'Pre-mandate historical transactions and voluntary disclosures submitted through 31 Dec 2027 are processed under SVDP 1.2/1.3 with 0% penalty and protected compliance audit tags.',
    enforcement: 'Dyau.ai tags voluntary disclosure payloads with SVDP_FLAG: true and partitions them into dedicated compliance audit tracks.',
    demoImpact: 'Toggle "SVDP Mode" in the Simulation Toolbox: witness the live SVDP badge, penalty immunity indicator, and dedicated audit log entry!'
  },
  'HR-18': {
    code: 'HR-18',
    name: 'SVDP Per-Original-Month Strict Batch Partitioning',
    category: 'Batch Processing',
    statutoryRef: 'LHDN Technical Interface for Historical Disclosures',
    summary: 'When submitting bulk retrospective e-Invoices under SVDP, transactions from different calendar months cannot be mixed in the same batch file; each batch must strictly represent a single original transaction month.',
    enforcement: 'Batch generator groups records by TransactionMonth and dispatches separate batch streams to LHDN.',
    demoImpact: 'Simulated in Batch File Output in Step 5 and Tab 4 Administration.'
  }
};

// ============================================================================
// SIMULATION ENGINE STATE VARIABLES
// ============================================================================
let simAmountMode = 'standard';    // 'standard' (RM9,720) or 'high_value' (RM15,120) -> HR-07
let sim72hMode = 'within';         // 'within' (24.5 hrs) or 'expired' (78.2 hrs) -> HR-04
let simSvdpMode = false;           // false (2026 Production) or true (SVDP 1.2 Amnesty Track) -> HR-17/18
let simGroupCarveOut = false;      // false (Standard Standalone) or true (Group Carve-Out) -> HR-02/03

let currentDocKey = 'invoice';
let currentStep = 1;
let currentOutcome = 'success';
let currentPartyFilter = 'all';

// Base Document Datasets
const baseDocDatasets = {
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

// Function to resolve dynamic document state based on simulation toggles
function getEffectiveDoc(typeKey) {
  const base = JSON.parse(JSON.stringify(baseDocDatasets[typeKey] || baseDocDatasets.invoice));

  // 1. Transaction Value & Threshold Rule (HR-07)
  if (typeKey === 'invoice' && simAmountMode === 'high_value') {
    base.docNumber = 'INV-2026-00128-HV';
    base.items = [
      { desc: 'Enterprise AI Architecture & Core Platform Licensing', qty: 1, price: '10,000.00', taxRate: '8% SST', taxAmt: '800.00', total: '10,800.00' },
      { desc: 'Dedicated GPU Burst Cluster (100 Compute Hours)', qty: 2, price: '2,000.00', taxRate: '8% SST', taxAmt: '320.00', total: '4,320.00' }
    ];
    base.subtotal = 'MYR 14,000.00';
    base.taxTotal = 'MYR 1,120.00';
    base.grandTotal = 'MYR 15,120.00';
    base.hr07Triggered = true;
  }

  // 2. Group Carve-Out Rule (HR-03 / HR-02)
  if (simGroupCarveOut) {
    base.issuerName = 'Dyau Tech Subsidiary Sdn Bhd (Turnover: RM1.8M)';
    base.groupCarveOutTriggered = true;
  }

  // 3. SVDP Voluntary Disclosure Track (HR-17 / HR-18)
  if (simSvdpMode) {
    base.docNumber = `SVDP-${base.docNumber}`;
    base.svdpTrackActive = true;
  }

  return base;
}

// Master Data Parties
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

// Reporting Documents Dataset
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
// DOM INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });
  }

  // 1. Main Workspace Tab Switching
  initWorkspaceTabs();

  // 2. Tab 1: Live Demo Initializer
  initLiveDemo();

  // 3. Tab 2: Master Data Initializer
  initMasterData();

  // 4. Tab 3: Reporting Dashboard Initializer
  initReportingDashboard();

  // 5. Tab 4: Administration Initializer
  initAdministration();

  // 6. Logic Inspector Modal Listeners
  initLogicModalSystem();
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
// 2. TAB 1: LIVE DEMO CONTROLLER & SIMULATION ENGINE
// ============================================================================
function initLiveDemo() {
  renderDocType(currentDocKey);
  renderStep(currentStep);
  renderOutcome(currentOutcome);

  // Document Type Selector Buttons
  const docBtns = document.querySelectorAll('.doc-type-btn');
  docBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const typeKey = btn.getAttribute('data-type');
      if (baseDocDatasets[typeKey]) {
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
    simAmountMode = 'standard';
    sim72hMode = 'within';
    simSvdpMode = false;
    simGroupCarveOut = false;
    syncSimulationToolboxUI();
    setStep(1);
    setOutcome('success');
    showToast('Demo reset to initial baseline (Standard Mode, Step 1).');
  });

  // Outcome Buttons (Step 5)
  const outcomeBtns = document.querySelectorAll('.outcome-choice-btn');
  outcomeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const outcomeKey = btn.getAttribute('data-outcome');
      setOutcome(outcomeKey);
    });
  });

  // Copy UUID Button
  document.getElementById('btn-copy-uuid')?.addEventListener('click', () => {
    const doc = getEffectiveDoc(currentDocKey);
    if (doc) {
      navigator.clipboard.writeText(doc.uuid).then(() => {
        showToast(`UUID copied: ${doc.uuid}`);
      });
    }
  });

  // Dummy QR Code Click
  document.getElementById('qr-preview-box')?.addEventListener('click', () => {
    const doc = getEffectiveDoc(currentDocKey);
    alert(`LHDN MyInvois Clearance Verification:\n\nUUID: ${doc.uuid}\nDocument No: ${doc.docNumber}\nStatus: Valid\nTimestamp: 10 October 2026, 12:49:58 MYT\nTotal: ${doc.grandTotal}\nVerification URI: https://myinvois.hasil.gov.my/verify/${doc.uuid}\n\n(Customer demonstration simulation)`);
  });

  // Wire up Simulation Toolbox Controls
  initSimulationToolbox();
}

function initSimulationToolbox() {
  // Amount / Threshold Toggle (HR-07)
  document.querySelectorAll('[data-sim="amount"]').forEach(btn => {
    btn.addEventListener('click', () => {
      simAmountMode = btn.getAttribute('data-val');
      syncSimulationToolboxUI();
      renderDocType(currentDocKey);
      if (simAmountMode === 'high_value') {
        showToast('Rule HR-07 Enforced: Single transaction > RM10,000 cannot be consolidated!');
      } else {
        showToast('Rule HR-07: Value RM9,720 is below RM10,000 threshold (Consolidation eligible).');
      }
    });
  });

  // 72-Hour Legal Window Toggle (HR-04)
  document.querySelectorAll('[data-sim="72h"]').forEach(btn => {
    btn.addEventListener('click', () => {
      sim72hMode = btn.getAttribute('data-val');
      syncSimulationToolboxUI();
      if (currentStep === 5) renderOutcome(currentOutcome);
      if (sim72hMode === 'expired') {
        showToast('Rule HR-04 Enforced: 72.0 hours elapsed. Cancel API returns HTTP 400! Credit Note (02) required.');
      } else {
        showToast('Rule HR-04 Active: Within 72.0 hours (24.5h elapsed). Cancellation API is legally available.');
      }
    });
  });

  // SVDP Voluntary Disclosure Mode (HR-17 / HR-18)
  document.querySelectorAll('[data-sim="svdp"]').forEach(btn => {
    btn.addEventListener('click', () => {
      simSvdpMode = (btn.getAttribute('data-val') === 'true');
      syncSimulationToolboxUI();
      renderDocType(currentDocKey);
      if (simSvdpMode) {
        showToast('Rule HR-17/18 Active: SVDP 1.2 Amnesty Track (0% penalty, per-month batching).');
      } else {
        showToast('Switched to Standard 2026 Production Compliance Track.');
      }
    });
  });

  // Group Carve-Out Toggle (HR-02 / HR-03)
  document.querySelectorAll('[data-sim="group"]').forEach(btn => {
    btn.addEventListener('click', () => {
      simGroupCarveOut = (btn.getAttribute('data-val') === 'true');
      syncSimulationToolboxUI();
      renderDocType(currentDocKey);
      if (simGroupCarveOut) {
        showToast('Rule HR-03 Anti-Avoidance: Subsidiary RM1.8M turnover denied exemption due to parent group turnover ≥ RM3M!');
      } else {
        showToast('Standard Taxpayer Profile (> RM3M turnover, Phase 3 mandated).');
      }
    });
  });
}

function syncSimulationToolboxUI() {
  document.querySelectorAll('[data-sim="amount"]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-val') === simAmountMode);
  });
  document.querySelectorAll('[data-sim="72h"]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-val') === sim72hMode);
  });
  document.querySelectorAll('[data-sim="svdp"]').forEach(btn => {
    btn.classList.toggle('active', (btn.getAttribute('data-val') === 'true') === simSvdpMode);
  });
  document.querySelectorAll('[data-sim="group"]').forEach(btn => {
    btn.classList.toggle('active', (btn.getAttribute('data-val') === 'true') === simGroupCarveOut);
  });
}

function renderDocType(typeKey) {
  const doc = getEffectiveDoc(typeKey);
  if (!doc) return;

  const natureAlert = document.getElementById('doc-nature-alert');
  if (natureAlert) {
    if (doc.isSelfBilled) {
      natureAlert.className = 'doc-nature-alert self-billed-alert';
      natureAlert.innerHTML = `
        <span style="font-size: 1.25rem;">⚡</span>
        <div>
          <strong>Self-Billed Transaction Mode (Doc Code: 11) • <button class="logic-pill" onclick="openLogicModal('HR-11')">Rule HR-11</button> <button class="logic-pill" onclick="openLogicModal('HR-12')">Rule HR-12</button>:</strong> 
          Under Malaysian tax guidelines, the <strong>Buyer acts as Issuer</strong> and signs the payload with their enterprise HSM key on behalf of the Supplier/Payee (e.g., agency commission or foreign supplier).
        </div>
      `;
    } else {
      let extraNotice = '';
      if (doc.hr07Triggered) {
        extraNotice = `<div style="margin-top: 6px; color: #DC2626; font-weight: 700;">⚠️ Notice: Grand total (${doc.grandTotal}) exceeds RM10,000. Under <button class="logic-pill" onclick="openLogicModal('HR-07')">Rule HR-07</button>, this single transaction CANNOT be consolidated into a monthly summary invoice. An individual e-Invoice is mandatory!</div>`;
      }
      if (doc.groupCarveOutTriggered) {
        extraNotice += `<div style="margin-top: 6px; color: #2563EB; font-weight: 700;">ℹ️ Group Carve-Out Active (<button class="logic-pill" onclick="openLogicModal('HR-03')">Rule HR-03</button>): Even though subsidiary revenue is RM1.8M (&lt;RM3M), related entity group turnover ≥ RM3M revokes the SME exemption!</div>`;
      }
      if (doc.svdpTrackActive) {
        extraNotice += `<div style="margin-top: 6px; color: #059669; font-weight: 700;">🛡️ Voluntary Disclosure Active (<button class="logic-pill" onclick="openLogicModal('HR-17')">Rule HR-17</button>): Processed under SVDP 1.2 framework with 0% statutory penalty guarantee.</div>`;
      }

      natureAlert.className = 'doc-nature-alert';
      natureAlert.innerHTML = `
        <span style="font-size: 1.25rem;">ℹ️</span>
        <div>
          <strong>Standard Commercial Document (Doc Code: ${doc.code}):</strong> The Supplier/Seller generates the document and delivers clearance to the Buyer via LHDN MyInvois.
          ${extraNotice}
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
  const doc = getEffectiveDoc(currentDocKey);
  if (!doc) return;

  const banner = document.getElementById('outcome-detail-banner');
  const bannerTitle = document.getElementById('outcome-banner-title');
  const bannerText = document.getElementById('outcome-banner-text');
  const finalOutputArea = document.getElementById('final-output-area');

  // Dynamic status text for cancelled based on HR-04 72-hour window
  if (outcomeKey === 'cancelled') {
    if (sim72hMode === 'expired') {
      banner.className = 'outcome-detail-banner res-rejected';
      bannerTitle.innerHTML = 'Cancellation Locked: 72-Hour Legal Window Expired (HTTP 400 Bad Request)';
      bannerText.innerHTML = `
        <strong>Enforced Rule HR-04:</strong> Elapsed time is <strong>78.2 hours</strong>, exceeding the official 72.0-hour statutory deadline. 
        Under Section 82C of the Income Tax Act 1967, direct cancellation is blocked by LHDN MyInvois. 
        <br><br>
        <strong>Legal Remedy:</strong> The issuer must issue an adjusting <button class="logic-pill" onclick="openLogicModal('HR-14')">Credit Note (Doc Code: 02)</button> linking to original UUID <code>${doc.uuid}</code> to reverse the transaction.
      `;
      if (finalOutputArea) finalOutputArea.style.display = 'none';
      return;
    } else {
      banner.className = 'outcome-detail-banner res-cancelled';
      bannerTitle.innerHTML = 'Document Cancelled within 72-Hour Legal Window (Elapsed: 24.5 hrs)';
      bannerText.innerHTML = `
        <strong>Active Rule HR-04:</strong> Elapsed time is <strong>24.5 hours</strong> (within the legal 72.0-hour window). 
        The document was cancelled via LHDN Cancel API. Both buyer and seller accounting ledgers receive cancellation audit receipts.
      `;
      if (finalOutputArea) finalOutputArea.style.display = 'none';
      return;
    }
  }

  // Handle standard outcomes
  if (outcomeKey === 'success') {
    banner.className = 'outcome-detail-banner res-success';
    bannerTitle.textContent = 'LHDN MyInvois Clearance: VALID (Code: 200 OK)';
    bannerText.innerHTML = `The document passed all statutory validation layers (schema, arithmetic, SST rates, and registry lookups). Official UUID and QR link generated. <button class="logic-pill" onclick="openLogicModal('HR-04')">72h Window Running</button>`;
    if (finalOutputArea) {
      finalOutputArea.style.display = 'block';
      updateValidatedCard();
      updateOutputsDual();
    }
  } else if (outcomeKey === 'hold') {
    banner.className = 'outcome-detail-banner res-hold';
    bannerTitle.textContent = 'Platform Notification: ON HOLD (Code: 102 Ingestion Hold)';
    bannerText.innerHTML = `Buyer Tax Identification Number (TIN) is undergoing regional synchronization or requires party master verification. System queues the invoice for automatic re-trigger without disrupting daily finance work. <button class="logic-pill" onclick="openLogicModal('HR-13')">General TIN Reference</button>`;
    if (finalOutputArea) finalOutputArea.style.display = 'none';
  } else if (outcomeKey === 'rejected') {
    banner.className = 'outcome-detail-banner res-rejected';
    bannerTitle.textContent = 'Regulatory Validation Exception: REJECTED (Code: 422 Invalid Exemption)';
    bannerText.innerHTML = `LHDN validation failed on Line Item 2: Tax classification code is incompatible with declared SST rate. Platform pinpoints the exact field for 1-click finance remediation. <button class="logic-pill" onclick="openLogicModal('HR-15')">Adjustment Restrictions</button>`;
    if (finalOutputArea) finalOutputArea.style.display = 'none';
  }
}

function updatePayloadViews() {
  const doc = getEffectiveDoc(currentDocKey);
  if (!doc) return;

  const payloadObj = {
    documentHeader: {
      documentType: doc.code,
      documentTypeName: doc.name,
      documentNumber: doc.docNumber,
      issueDate: "2026-10-10T12:49:30Z",
      currencyCode: doc.currency,
      originalReference: doc.originalRef,
      statutoryPhasing: "Phase 3 (Mandated)",
      regulatoryProgram: doc.svdpTrackActive ? "SVDP 1.2 Voluntary Amnesty" : "Standard 2026 Production",
      singleTransactionThresholdExceeded: doc.hr07Triggered || false
    },
    supplier: {
      tin: doc.issuerTIN,
      registrationNo: doc.issuerBRN,
      sstRegistration: doc.issuerSST,
      name: doc.issuerName,
      address: doc.issuerAddress,
      groupCarveOutApplied: doc.groupCarveOutTriggered || false
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
      grandTotal: doc.grandTotal,
      consolidationEligible: !doc.hr07Triggered
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
        ${doc.svdpTrackActive ? '<div class="summary-field-row"><span class="field-label" style="color: #059669; font-weight: 700;">Amnesty Track</span><span class="field-val" style="color: #059669;">SVDP 1.2 Active</span></div>' : ''}
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
          <span class="field-val" style="color: ${doc.hr07Triggered ? '#DC2626' : 'var(--color-accent)'};">${doc.grandTotal}</span>
        </div>
        ${doc.hr07Triggered ? '<div style="font-size: 0.72rem; color: #DC2626; font-weight: 700; margin-top: 4px;">⚠️ Exceeds RM10,000: Individual e-Invoice only (HR-07)</div>' : ''}
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
  const doc = getEffectiveDoc(currentDocKey);
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
  const doc = getEffectiveDoc(currentDocKey);
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
      cancellationWindow: {
        statutoryLimitHours: 72.0,
        elapsedHours: (sim72hMode === 'expired') ? 78.2 : 24.5,
        status: (sim72hMode === 'expired') ? "EXPIRED (Locked per Section 82C ITA 1967 - CN 02 Required)" : "ACTIVE (Cancellation permissible)"
      },
      consolidationStatus: {
        eligibleForMonthlyConsolidation: !doc.hr07Triggered,
        reason: doc.hr07Triggered ? "PROHIBITED: Single transaction exceeds RM10,000 threshold (Rule HR-07)" : "Eligible under standard retail criteria"
      },
      svdpFramework: {
        isVoluntaryDisclosure: doc.svdpTrackActive || false,
        programVersion: doc.svdpTrackActive ? "SVDP 1.2" : "N/A",
        penaltyRate: doc.svdpTrackActive ? "0% Protected Amnesty" : "Standard"
      },
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
    `# Regulatory Regime: ${doc.svdpTrackActive ? 'SVDP 1.2 Voluntary Amnesty (HR-17/18)' : 'Standard 2026 Production Phase 3'}`,
    `DOC_TYPE,DOC_NUM,ORIGINAL_REF,UUID,STATUS,LHDN_TIMESTAMP,AMOUNT_MYR,HR07_CONSOL_ELIGIBLE,72H_WINDOW,REMARKS`,
    `${doc.code},"${doc.docNumber}","${doc.originalRef}","${doc.uuid}","Valid","2026-10-10 12:49:58","${doc.grandTotal}","${!doc.hr07Triggered}","${sim72hMode === 'expired' ? 'LOCKED_PAST_72H' : 'ACTIVE_24.5H'}","CLEARANCE_SUCCESS"`
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
    if (currentPartyFilter === 'Customer' && p.type !== 'Customer' && p.type !== 'Both') return false;
    if (currentPartyFilter === 'Supplier' && p.type !== 'Supplier' && p.type !== 'Both') return false;
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
  alert(`Party Master Profile (Rule HR-13 Compliant):\n\nEntity Name: ${p.name}\nParty Role: ${p.type}\nTIN (Tax ID): ${p.tin}\nBRN (Reg No): ${p.brn}\nSST ID: ${p.sst}\nMSIC Activity: ${p.msic}\nContact Email: ${p.email}\nPhone: ${p.phone}\nRegistered Address:\n${p.address}`);
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
// 6. LOGIC MODAL SYSTEM & INSPECTOR
// ============================================================================
function initLogicModalSystem() {
  document.getElementById('btn-close-logic-modal')?.addEventListener('click', closeLogicModal);
  document.getElementById('logic-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'logic-modal-overlay') closeLogicModal();
  });
}

window.openLogicModal = function(logicKey) {
  const modal = document.getElementById('logic-modal-overlay');
  const container = document.getElementById('logic-modal-dynamic-content');
  if (!modal || !container) return;

  if (logicKey === 'all') {
    // Render full matrix
    let html = `
      <div style="margin-bottom: 24px;">
        <span class="logic-modal-category">Statutory Compliance Catalogue</span>
        <h3 class="logic-modal-title">Malaysian e-Invoicing Regulatory Logics Matrix (18 Rules)</h3>
        <p style="font-size: 0.88rem; color: var(--color-body); margin-bottom: 16px;">
          Dyau.ai natively enforces all statutory rules mandated by the Inland Revenue Board of Malaysia (LHDN MyInvois) under the Income Tax Act 1967. Click any rule to inspect:
        </p>
      </div>

      <div style="display: grid; gap: 14px;">
    `;

    Object.keys(businessLogicsData).forEach(key => {
      const item = businessLogicsData[key];
      html += `
        <div style="background: var(--bg-muted); border: 1px solid var(--color-border); border-radius: 8px; padding: 14px 16px; cursor: pointer; transition: all 0.2s;" onclick="openLogicModal('${item.code}')">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: var(--color-primary); font-size: 0.95rem;">${item.code}: ${item.name}</strong>
            <span style="font-size: 0.72rem; background: var(--color-surface); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--color-border); color: var(--color-secondary); font-weight: 700;">${item.category}</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--color-body); margin: 0 0 6px 0;">${item.summary}</p>
          <div style="font-size: 0.74rem; color: var(--color-accent); font-weight: 600;">🔍 Ref: ${item.statutoryRef}</div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  } else {
    // Render single rule detail
    const rule = businessLogicsData[logicKey] || businessLogicsData['HR-01'];
    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <span class="logic-modal-category">${rule.category}</span>
        <h3 class="logic-modal-title">${rule.code}: ${rule.name}</h3>
      </div>

      <div class="logic-spec-row">
        <div class="logic-spec-label">Official Statutory Reference</div>
        <div class="logic-spec-body" style="font-weight: 600; color: var(--color-heading);">
          🏛️ ${rule.statutoryRef}
        </div>
      </div>

      <div class="logic-spec-row">
        <div class="logic-spec-label">Regulatory Requirement & Scope</div>
        <div class="logic-spec-body">
          ${rule.summary}
        </div>
      </div>

      <div class="logic-spec-row">
        <div class="logic-spec-label">Dyau.ai SaaS Platform Real-Time Enforcement</div>
        <div class="logic-spec-body" style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 10px 14px; border-radius: 6px; color: #166534;">
          ⚡ <strong>Automated Engine:</strong> ${rule.enforcement}
        </div>
      </div>

      <div class="logic-spec-row">
        <div class="logic-spec-label">How to Test & Observe in this Interactive Demo</div>
        <div class="logic-spec-body" style="background: #EFF6FF; border: 1px solid #BFDBFE; padding: 10px 14px; border-radius: 6px; color: #1E40AF;">
          🧪 <strong>Demo Simulation:</strong> ${rule.demoImpact}
        </div>
      </div>

      <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 10px;">
        <button class="btn btn-outline" onclick="openLogicModal('all')">← Back to All 18 Rules</button>
        <button class="btn btn-proceed" onclick="closeLogicModal()">Close Inspector</button>
      </div>
    `;
  }

  modal.classList.add('active');
};

window.closeLogicModal = function() {
  document.getElementById('logic-modal-overlay')?.classList.remove('active');
};

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
  }, 2400);
}
