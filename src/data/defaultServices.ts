export interface ServiceItem {
  id: string;
  name: string;
  isNew?: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  services: ServiceItem[];
}

export const CATEGORIES: ServiceCategory[] = [
  {
    id: "business-setup",
    name: "Business Setup & Corporate",
    shortName: "Business Setup",
    description:
      "End-to-end corporate formation, trade licensing, amendments, virtual offices, and legal company liquidation across Abu Dhabi & UAE.",
    services: [
      { id: "bs-1", name: "Business Setup Services" },
      { id: "bs-2", name: "Company Formation Services" },
      { id: "bs-3", name: "Company Liquidation & License Cancellation" },
      { id: "bs-4", name: "Economic License Details", isNew: true },
      { id: "bs-5", name: "Business Activity Inquiry", isNew: true },
      { id: "bs-6", name: "Corporate Services Abu Dhabi" },
      { id: "bs-7", name: "Businessmen & Support Services" },
      { id: "bs-8", name: "Virtual Offices Abu Dhabi" },
      { id: "bs-9", name: "Business Bank Account Opening" },
      { id: "bs-10", name: "UAE TAX & VAT Services" },
      { id: "bs-11", name: "Trademark Registration" },
      { id: "bs-12", name: "Copyright Registration" },
      { id: "bs-13", name: "Patent Registration" },
    ],
  },
  {
    id: "uae-visas",
    name: "UAE Visas & Residency",
    shortName: "UAE Visas",
    description:
      "Comprehensive immigration and residency solutions including Golden Visa, Investor, Family, and employment clearance.",
    services: [
      { id: "uv-1", name: "UAE Family Visa" },
      { id: "uv-2", name: "Family Visa Holding" },
      { id: "uv-3", name: "Golden Visa (10-Year)" },
      { id: "uv-4", name: "Investor & Partner Visa" },
      { id: "uv-5", name: "Green Visa (5-Year)" },
      { id: "uv-6", name: "Employment Visa Services" },
      { id: "uv-7", name: "Domestic Worker / Maid Visa" },
      { id: "uv-8", name: "Tourist / Visit Visa" },
      { id: "uv-9", name: "Mission Visa Abu Dhabi" },
      { id: "uv-10", name: "Fine Reduction Services" },
      { id: "uv-11", name: "Out Pass (Exit Clearance)", isNew: true },
    ],
  },
  {
    id: "gov-portals",
    name: "Government Portals & PRO",
    shortName: "Gov Portals",
    description:
      "Direct integration and transaction processing with official UAE federal and local government systems.",
    services: [
      { id: "gp-1", name: "Tasheel Services (MOHRE)", isNew: true },
      { id: "gp-2", name: "TAMM Services (Abu Dhabi)", isNew: true },
      { id: "gp-3", name: "Tawjeeh Services", isNew: true },
      { id: "gp-4", name: "Tadbeer Services", isNew: true },
      { id: "gp-5", name: "Municipality Services", isNew: true },
      { id: "gp-6", name: "Tawteek Work (Tawtheeq)", isNew: true },
      { id: "gp-7", name: "ADNOC Registration" },
      { id: "gp-8", name: "Government Entity Approvals & NOCs" },
    ],
  },
  {
    id: "foreign-visas",
    name: "Foreign Visas & Travel",
    shortName: "Foreign Visas",
    description:
      "Global outbound visa consultation, appointment booking, document preparation, and flight reservations.",
    services: [
      { id: "fv-1", name: "American Visa (US)", isNew: true },
      { id: "fv-2", name: "Schengen Visa (Europe)", isNew: true },
      { id: "fv-3", name: "Canada Visa", isNew: true },
      { id: "fv-4", name: "Saudi Visa (KSA)", isNew: true },
      { id: "fv-5", name: "Foreign Visa Assistance" },
      { id: "fv-6", name: "Travel Desk & Ticket Booking" },
    ],
  },
  {
    id: "legal-attestation",
    name: "Legal, Attestation & Translation",
    shortName: "Legal & Attestation",
    description:
      "Certified legal translation, foreign document legalization, embassy attestation, and notary services.",
    services: [
      { id: "la-1", name: "Certificate Attestation (MOFA & Embassy)" },
      { id: "la-2", name: "Certificate Equivalency Services" },
      { id: "la-3", name: "Genuineness Certificate" },
      { id: "la-4", name: "Legal Arabic & English Translation" },
      { id: "la-5", name: "Notary Services Abu Dhabi" },
      { id: "la-6", name: "Police Clearance Certificate (PCC)" },
      { id: "la-7", name: "Legal & Court Services" },
    ],
  },
  {
    id: "traffic-vehicles",
    name: "Traffic, Vehicles & Tolls",
    shortName: "Traffic & Tolls",
    description:
      "Comprehensive vehicle administration, driver licensing, toll gate registrations, and commercial transport permits.",
    services: [
      { id: "tv-1", name: "Traffic Dept Work", isNew: true },
      { id: "tv-2", name: "Vehicle Services Abu Dhabi" },
      { id: "tv-3", name: "Abu Dhabi Driving License" },
      { id: "tv-4", name: "Abu Dhabi Police Security for Vehicle", isNew: true },
      { id: "tv-5", name: "DARB Toll Registration", isNew: true },
      { id: "tv-6", name: "Salik Registration", isNew: true },
      { id: "tv-7", name: "ITC Services (Transport)", isNew: true },
      { id: "tv-8", name: "Asateel Work (Fleet Tracking)", isNew: true },
    ],
  },
  {
    id: "labor-insurance",
    name: "Labor, Payroll & Insurance",
    shortName: "Labor & Insurance",
    description:
      "Mandatory worker protection schemes, salary compliance, unemployment insurance, and health policies.",
    services: [
      { id: "li-1", name: "WPS Service (Wage Protection)", isNew: true },
      { id: "li-2", name: "WP Insurance (Work Permit)", isNew: true },
      { id: "li-3", name: "ILOE Insurance (Job Loss)" },
      { id: "li-4", name: "Health & Vehicle Insurance" },
      { id: "li-5", name: "General Insurance Services" },
    ],
  },
  {
    id: "pro-compliance",
    name: "Professional Licensing & Compliance",
    shortName: "Licensing & Compliance",
    description:
      "Specialized healthcare, engineering, anti-money laundering, and national security clearances.",
    services: [
      { id: "pc-1", name: "CICPA Pass (CNA / Port Passes)" },
      { id: "pc-2", name: "AML Registration (goAML)", isNew: true },
      { id: "pc-3", name: "Medical Professional Licensing (DOH/DHA)" },
      { id: "pc-4", name: "Engineer License Registration" },
      { id: "pc-5", name: "ICV Certification" },
      { id: "pc-6", name: "ISO Certification" },
    ],
  },
  {
    id: "typing-office",
    name: "Typing & Office Services",
    shortName: "Typing & Office",
    description:
      "Front-office document drafting, bilingual typing, executive CV writing, high-speed printing, and digital marketing.",
    services: [
      { id: "to-1", name: "Arabic & English Typing" },
      { id: "to-2", name: "Transactions Follow-up" },
      { id: "to-3", name: "Professional CV Writing", isNew: true },
      { id: "to-4", name: "PRINT Color and Black", isNew: true },
      { id: "to-5", name: "Digital Marketing Abu Dhabi" },
    ],
  },
];

export interface RequiredDocument {
  title: string;
  description: string;
  mandatory: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ServiceDetail {
  slug: string;
  id: string;
  name: string;
  category: {
    id: string;
    name: string;
    shortName: string;
  };
  tagline: string;
  requiredDocuments: RequiredDocument[];
  faqs: FAQItem[];
}

// Clean URL slug generator
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-alphanumeric except space and hyphen
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-"); // collapse duplicate hyphens
}

// Tailored content dictionary for individual services
const TAILORED_SERVICES: Record<string, Partial<ServiceDetail>> = {
  /* =========================================================================
     1. Business Setup & Corporate
     ========================================================================= */
  "business-setup-services": {
    tagline: "End-to-end commercial mainland and free zone company formation across Abu Dhabi and the UAE.",
    requiredDocuments: [
      { title: "Partners' & Managers' Passport Copies", description: "Color copies with at least 6 months validity.", mandatory: true },
      { title: "UAE Residence Visa / Entry Stamp / Tourist Visa", description: "Proof of current legal entry or residency status in the UAE.", mandatory: true },
      { title: "Emirates ID (if existing resident)", description: "Front and back copy of Emirates ID card.", mandatory: false },
      { title: "Proposed Trade Names (3 Choices)", description: "Trade names for initial approval and reservation with ADDED.", mandatory: true },
      { title: "Ejari / Tawtheeq Lease Contract", description: "Physical office or virtual office registration certificate.", mandatory: true },
    ],
    faqs: [
      { question: "Can a foreigner own 100% of a mainland commercial company?", answer: "Yes. Under UAE Federal Commercial Companies Law, 100% foreign ownership is permitted for most commercial and industrial business activities without requiring a local Emirati partner." },
      { question: "How long does mainland business licensing take in Abu Dhabi?", answer: "Initial approval and trade name reservation can be completed within 24 to 48 hours. The entire commercial license issuance typically takes 3 to 5 business days once office leasing (Tawtheeq) is finalized." },
    ],
  },
  "company-formation-services": {
    tagline: "Turnkey LLC, Sole Establishment, and Branch Office incorporation with complete DED/TAMM licensing.",
    requiredDocuments: [
      { title: "Passports of all Shareholders & General Manager", description: "Clear color scans with minimum 6 months validity.", mandatory: true },
      { title: "Notarized Memorandum of Association (MOA)", description: "Drafted bilingual legal memorandum defining shareholder equity and manager authorities.", mandatory: true },
      { title: "Trade Name Reservation & Initial Approval", description: "Official initial clearance certificate from the Department of Economic Development.", mandatory: true },
      { title: "Tawtheeq Virtual / Physical Office Agreement", description: "Registered commercial address certificate.", mandatory: true },
    ],
    faqs: [
      { question: "What is the difference between an LLC and a Sole Establishment?", answer: "A Limited Liability Company (LLC) limits shareholder liability to their capital investment and supports 2 to 50 partners. A Sole Establishment is owned 100% by a single individual who holds full commercial liability." },
      { question: "Do you assist with post-incorporation corporate bank accounts?", answer: "Yes. We coordinate directly with top UAE commercial and digital banks with dedicated relationship managers to expedite corporate account openings." },
    ],
  },
  "company-liquidation-license-cancellation": {
    tagline: "Official, risk-free LLC & Commercial license cancellation across Abu Dhabi and all UAE Free Zones.",
    requiredDocuments: [
      { title: "Original Trade License & Commercial Register", description: "Official DED/TAMM commercial registration and membership certificates.", mandatory: true },
      { title: "Memorandum of Association (MOA) & Amendments", description: "Notarized MOA and all notarized addendums showing partner shareholding.", mandatory: true },
      { title: "Partners' & Manager's Passports & Emirates IDs", description: "Valid or historical passport copies, UAE residence visas, and Emirates IDs.", mandatory: true },
      { title: "Company Liquidation Resolution", description: "Notarized Board/Partner resolution declaring liquidation & appointing liquidator.", mandatory: true },
      { title: "Establishment Card Cancellations", description: "Immigration (ICP/GDRFA) and Labor (MOHRE) establishment clearance proofs.", mandatory: true },
      { title: "Utility & Tenancy Clearances (Tawtheeq/DEWA)", description: "Final bill clearance certificates and tenancy contract termination confirmation.", mandatory: false },
    ],
    faqs: [
      { question: "Can we cancel a company license if partners are currently outside the UAE?", answer: "Yes. Partners can grant an attested Special Power of Attorney (POA) via UAE digital remote notarization systems to allow ABC Typing's PRO team to sign and finalize all proceedings." },
      { question: "What happens to employee visas during company liquidation?", answer: "All sponsored employees must be transferred to new employers or their employment visas formally cancelled through MOHRE and ICP before the final liquidation certificate is issued." },
      { question: "Will partners face travel bans if the license has outstanding fines?", answer: "We conduct an immediate pre-audit with TAMM and court registries to negotiate fine reductions or payment dispensations before final cancellation, protecting partners from sudden travel bans." },
    ],
  },
  "economic-license-details": {
    tagline: "Comprehensive official audit, license status verification, and commercial record inquiries via ADDED/TAMM.",
    requiredDocuments: [
      { title: "Trade License Number or Commercial Name", description: "Current or historical trade license reference number.", mandatory: true },
      { title: "Partner / Manager Emirates ID or Passport", description: "Identification for authorized signatory access.", mandatory: true },
    ],
    faqs: [
      { question: "What details are included in an Economic License extract?", answer: "The extract displays full legal name, license status, expiry dates, registered partners, authorized managers, registered activities, and any judicial or administrative blocks." },
    ],
  },
  "business-activity-inquiry": {
    tagline: "Regulatory classification, external approvals assessment, and economic activity code verification.",
    requiredDocuments: [
      { title: "Proposed Business Activities List", description: "Detailed description of products, services, or commercial operations planned.", mandatory: true },
      { title: "Existing License Copy (if adding activities)", description: "Copy of current trade license for activity amendment assessments.", mandatory: false },
    ],
    faqs: [
      { question: "How do I know if my activity requires external security or municipal approvals?", answer: "Our PRO team references the official Abu Dhabi Department of Economic Development (ADDED) activity registry to identify all required ministerial approvals (Civil Defense, FANR, DOH, or Police)." },
    ],
  },
  "corporate-services-abu-dhabi": {
    tagline: "Retained PRO, secretarial, trade amendments, and annual compliance management for corporations.",
    requiredDocuments: [
      { title: "Valid Commercial Trade License", description: "Current mainland or free zone commercial registration.", mandatory: true },
      { title: "Establishment Computer Card (Immigration & Labor)", description: "Official company signature authorization cards.", mandatory: true },
      { title: "Authorized Signatory Power of Attorney (POA)", description: "Notarized POA assigning corporate PRO representation to ABC Typing.", mandatory: true },
    ],
    faqs: [
      { question: "Can ABC Typing manage all company labor and immigration quotas?", answer: "Yes. We manage your company's MOHRE electronic quota, work permit issuances, renewals, and immigration file renewals under an annual corporate service agreement." },
    ],
  },
  "businessmen-support-services": {
    tagline: "Concierge executive assistance, translation, document attestation, and fast-track government clearances.",
    requiredDocuments: [
      { title: "Applicant Passport Copy & Emirates ID", description: "Valid personal identification.", mandatory: true },
      { title: "Service Specific Brief / Transaction Request", description: "Details of transactions or authorizations required.", mandatory: true },
    ],
    faqs: [
      { question: "Do you offer emergency same-day processing for executives?", answer: "Yes. We provide dedicated VIP PRO officers for priority government processing, fast-track typing, and embassy clearances." },
    ],
  },
  "virtual-offices-abu-dhabi": {
    tagline: "Cost-effective, 100% compliant virtual business address solutions with registered Tawtheeq certificates.",
    requiredDocuments: [
      { title: "Trade License Copy or Initial Approval", description: "Valid commercial registration or DED name reservation.", mandatory: true },
      { title: "Owner / Manager Passport and Emirates ID", description: "Authorized signatory identification.", mandatory: true },
    ],
    faqs: [
      { question: "Is a virtual office legal for renewing a mainland trade license in Abu Dhabi?", answer: "Yes. ADDED allows authorized commercial activities to operate under an approved virtual office or shared business desk with an official Tawtheeq registration." },
    ],
  },
  "business-bank-account-opening": {
    tagline: "Seamless corporate banking advisory, document preparation, and direct bank compliance facilitation.",
    requiredDocuments: [
      { title: "Trade License, Commercial Register & MOA", description: "Complete certified corporate formation pack.", mandatory: true },
      { title: "Partners' Passports, Emirates IDs & UAE Visas", description: "Identification for all shareholders owning 10%+ equity.", mandatory: true },
      { title: "6-Month Personal or Foreign Company Bank Statements", description: "Demonstrating source of funds and financial standing.", mandatory: true },
      { title: "Company Profile, Business Plan & Client Contracts", description: "Brief overview of business operations, major suppliers, and clients.", mandatory: true },
    ],
    faqs: [
      { question: "How long does opening a corporate bank account take?", answer: "With properly prepared compliance packs, account verification usually takes between 10 business days to 3 weeks depending on the bank and shareholder nationality." },
    ],
  },
  "uae-tax-vat-services": {
    tagline: "Official Federal Tax Authority (FTA) registration, VAT return filing, and Corporate Tax compliance.",
    requiredDocuments: [
      { title: "Trade License & MOA", description: "Valid corporate registration documents.", mandatory: true },
      { title: "Manager / Owner Passport and Emirates ID", description: "Authorized signatory credentials.", mandatory: true },
      { title: "Audited Financial Statements / Sales Invoices", description: "Proof of exceeding mandatory VAT threshold (AED 375,000) or voluntary (AED 187,500).", mandatory: true },
      { title: "Corporate Bank Account Details & IBAN", description: "Official bank confirmation letter.", mandatory: true },
    ],
    faqs: [
      { question: "Who is required to register for UAE Corporate Tax?", answer: "All UAE mainland and free zone corporate businesses carrying out commercial activity are required to register for Corporate Tax with the FTA, regardless of annual turnover." },
    ],
  },
  "trademark-registration": {
    tagline: "Protect your brand name, logo, and intellectual property across the UAE with the Ministry of Economy.",
    requiredDocuments: [
      { title: "High-Resolution Logo / Brand Design", description: "Clear visual file of mark or logo.", mandatory: true },
      { title: "Trade License Copy", description: "Current valid UAE or foreign commercial license.", mandatory: true },
      { title: "List of Goods & Services (Nice Classification)", description: "Class numbers under which trademark protection is sought.", mandatory: true },
      { title: "Power of Attorney (POA)", description: "Notarized POA authorizing trademark representation.", mandatory: true },
    ],
    faqs: [
      { question: "How long is a registered trademark valid in the UAE?", answer: "A registered UAE trademark is protected for 10 years from the filing date and can be renewed indefinitely." },
    ],
  },
  "copyright-registration": {
    tagline: "Legal protection for software, literary works, creative arts, and digital content with Ministry of Economy.",
    requiredDocuments: [
      { title: "Copy of the Creative Work / Software Code / Content", description: "Complete deposit copy of the work.", mandatory: true },
      { title: "Author / Company Identification Documents", description: "Emirates ID, passport, or company trade license.", mandatory: true },
      { title: "Declaration of Original Ownership", description: "Formal statement of authorship.", mandatory: true },
    ],
    faqs: [
      { question: "Why register a copyright officially in the UAE?", answer: "Official copyright registration provides enforceable legal ownership in UAE courts, enabling swift action against counterfeiting and piracy." },
    ],
  },
  "patent-registration": {
    tagline: "Patent search, technical drafting, and invention registration through the UAE Ministry of Economy.",
    requiredDocuments: [
      { title: "Detailed Technical Invention Specification", description: "Drawings, claims, and abstract in Arabic and English.", mandatory: true },
      { title: "Inventor / Applicant Identification", description: "Passport copies or commercial entity registration.", mandatory: true },
      { title: "Priority Document (if claiming foreign filing)", description: "Certified copy of prior foreign patent filing.", mandatory: false },
    ],
    faqs: [
      { question: "How long does a patent grant take?", answer: "Patent examination typically takes 18 to 36 months, with legal protection retroactive to the initial filing priority date." },
    ],
  },

  /* =========================================================================
     2. UAE Visas & Residency
     ========================================================================= */
  "uae-family-visa": {
    tagline: "Complete family sponsorship for spouse, children, and parents under Abu Dhabi ICP immigration regulations.",
    requiredDocuments: [
      { title: "Sponsor's Original Emirates ID & Passport Copy", description: "Valid residency visa page and Emirates ID.", mandatory: true },
      { title: "Attested Marriage Certificate", description: "MOFA-attested marriage certificate translated into Arabic.", mandatory: true },
      { title: "Attested Birth Certificates for Children", description: "MOFA-attested birth certificates for each dependent.", mandatory: true },
      { title: "Registered Tenancy Contract (Tawtheeq / Ejari)", description: "Valid residential lease in the sponsor's name.", mandatory: true },
      { title: "Official Salary Certificate / Labor Contract", description: "Showing minimum monthly salary of AED 4,000 or AED 3,000 + accommodation.", mandatory: true },
      { title: "3-Month Bank Statements", description: "Stamped bank statements showing regular monthly salary crediting.", mandatory: true },
    ],
    faqs: [
      { question: "What is the maximum age for sons to be sponsored on a family visa?", answer: "Under current UAE residency rules, sons can be sponsored up to age 25. Unmarried daughters have no age restriction." },
      { question: "Can a mother sponsor her children in the UAE?", answer: "Yes, mothers can sponsor their children provided they meet the minimum monthly salary threshold and provide an NOC from the father (or court custody order)." },
    ],
  },
  "family-visa-holding": {
    tagline: "Hold family residence visas legally while changing jobs, company sponsorships, or upgrading to investor visa.",
    requiredDocuments: [
      { title: "Sponsor's New Job Offer Letter or Trade License", description: "Proof of incoming employment or company ownership.", mandatory: true },
      { title: "Sponsor's Current Passport & Emirates ID", description: "Identification documents of the primary sponsor.", mandatory: true },
      { title: "Dependents' Passports & Current Visa Copies", description: "Documents for family members whose visas are being held.", mandatory: true },
      { title: "Refundable Security Deposit (AED 5,000)", description: "Payable directly to ICP immigration portal (refunded upon new visa stamping).", mandatory: true },
    ],
    faqs: [
      { question: "How long can dependents' visas be held?", answer: "Visas can be held for up to 60 days, giving you ample time to cancel your old visa, process your new residency, and reinstate your dependents without fines or cancellations." },
    ],
  },
  "golden-visa-10-year": {
    tagline: "Exclusive 10-Year UAE Golden Residency for Investors, Executives, Scientists & High-Skilled Professionals.",
    requiredDocuments: [
      { title: "Valid Passport & Current UAE Visa Copy", description: "Colored copies of passport with at least 6 months validity and current visa page.", mandatory: true },
      { title: "Attested Degree / Educational Certificate", description: "Bachelor's degree or higher attested by MOFA with Ministry of Education equivalency.", mandatory: true },
      { title: "Salary Certificate / Labor Contract (or Title Deed)", description: "Official salary certificate (AED 30k+) or Dubai/Abu Dhabi Land Dept Title Deed (AED 2M+).", mandatory: true },
      { title: "6-Month Official Bank Statements", description: "Original bank-stamped wage statements confirming monthly salary crediting.", mandatory: true },
      { title: "Comprehensive Health Insurance Policy", description: "Valid UAE health insurance card or policy coverage document.", mandatory: true },
    ],
    faqs: [
      { question: "Can I sponsor my parents and children on a 10-Year Golden Visa?", answer: "Yes. Golden Visa holders can sponsor spouses, children of any age, and parents under a 10-year residency term." },
      { question: "Can I remain outside the UAE for more than 6 months?", answer: "Yes. Golden Visa holders are exempt from the 6-month exit rule and their residency remains active regardless of how long they stay abroad." },
    ],
  },
  "investor-partner-visa": {
    tagline: "3-Year renewable UAE residency for mainland and free zone company shareholders and business partners.",
    requiredDocuments: [
      { title: "Valid Trade License & Commercial Register", description: "Displaying partner's name and share ownership.", mandatory: true },
      { title: "Memorandum of Association (MOA)", description: "Notarized legal agreement confirming capital contribution.", mandatory: true },
      { title: "Immigration Establishment Card", description: "Active company file with ICP / GDRFA.", mandatory: true },
      { title: "Passport Copy & White Background Photo", description: "Valid passport with at least 6 months validity.", mandatory: true },
    ],
    faqs: [
      { question: "Does an investor visa holder need to contribute to MOHRE labor insurance?", answer: "No. Company partners and investors are registered with immigration directly and are exempt from MOHRE labor cards and WPS salary requirements." },
    ],
  },
  "green-visa-5-year": {
    tagline: "Self-sponsored 5-year residency for freelancers, self-employed specialists, and skilled professionals.",
    requiredDocuments: [
      { title: "Freelance / Self-Employment Permit from MOHRE", description: "Official freelance work permit.", mandatory: true },
      { title: "Attested Bachelor's Degree or Equivalent", description: "MOFA-attested academic certificate.", mandatory: true },
      { title: "Proof of Annual Income (Min AED 360,000 over 2 years)", description: "Bank statements or freelance contract earnings.", mandatory: true },
      { title: "Valid Passport & Medical Fitness Test", description: "Standard residency health clearance.", mandatory: true },
    ],
    faqs: [
      { question: "Does the Green Visa require an employer sponsor?", answer: "No. Green Visa holders are 100% self-sponsored and do not require a corporate sponsor or local agent." },
    ],
  },
  "employment-visa-services": {
    tagline: "Complete corporate work permit filing, quota approvals, medical typing, and Emirates ID stamping.",
    requiredDocuments: [
      { title: "MOHRE Electronic Work Permit Approval", description: "Official ministry quota allocation.", mandatory: true },
      { title: "Signed Bilingual Job Offer Letter", description: "Official contract signed by employee and employer.", mandatory: true },
      { title: "Employee Passport Copy & Photo", description: "Valid passport with 6+ months validity.", mandatory: true },
      { title: "Attested Educational Degree (for Skill Levels 1–3)", description: "Required for managerial, engineering, and medical titles.", mandatory: false },
    ],
    faqs: [
      { question: "What is the grace period after employment visa cancellation?", answer: "Under current regulations, expatriates have between 30 to 180 days (depending on skill level and tenure) of grace period to exit or transfer to a new sponsor." },
    ],
  },
  "domestic-worker-maid-visa": {
    tagline: "Hassle-free Tadbeer maid, nanny, cook, and driver visa processing under UAE Domestic Labor regulations.",
    requiredDocuments: [
      { title: "Sponsor's Emirates ID, Passport & Visa Copy", description: "Valid proof of residency.", mandatory: true },
      { title: "Sponsor's Salary Certificate & Bank Statement", description: "Demonstrating minimum required income threshold.", mandatory: true },
      { title: "Tawtheeq Tenancy Contract (Min 2-Bedroom for maids)", description: "Proof of adequate residential accommodation.", mandatory: true },
      { title: "Domestic Worker Passport Copy & Photos", description: "Valid travel document with home country clearances.", mandatory: true },
    ],
    faqs: [
      { question: "What countries can domestic workers be recruited from?", answer: "Recruitment is regulated through bilateral agreements with countries including the Philippines, Indonesia, Ethiopia, Kenya, Sri Lanka, and Nepal." },
    ],
  },
  "tourist-visit-visa": {
    tagline: "30-day and 60-day single/multi-entry UAE tourist visas processed within 24 to 48 hours.",
    requiredDocuments: [
      { title: "Clear Passport Scan (Information Page)", description: "Passport must have at least 6 months validity.", mandatory: true },
      { title: "Passport Size Color Photo (White Background)", description: "High-resolution studio photograph.", mandatory: true },
      { title: "Return Flight Booking & Hotel Reservation", description: "Proof of travel itinerary.", mandatory: false },
    ],
    faqs: [
      { question: "Can a 60-day tourist visa be extended without exiting the UAE?", answer: "Yes, visitors can extend their tourist visas inside the country without exiting through our fast-track in-country extension service." },
    ],
  },
  "mission-visa-abu-dhabi": {
    tagline: "Temporary 90-day corporate work visa for short-term project contractors, consultants, and technicians.",
    requiredDocuments: [
      { title: "Company Trade License & Establishment Card", description: "Hiring entity's corporate registration.", mandatory: true },
      { title: "Mission Work Permit Application via MOHRE", description: "Formal request for short-term project deployment.", mandatory: true },
      { title: "Worker Passport Copy & Relevant Credentials", description: "Valid passport and technical trade certifications.", mandatory: true },
    ],
    faqs: [
      { question: "Can a mission visa be converted to a regular employment visa?", answer: "Yes, an employee on an active mission visa can be transitioned to a permanent 2-year employment residency without exiting the country." },
    ],
  },
  "fine-reduction-services": {
    tagline: "Official representation and humanitarian fine reduction appeals with Abu Dhabi ICP, GDRFA, and courts.",
    requiredDocuments: [
      { title: "Overstay Fine Statement / Printout", description: "Official breakdown obtained from the ICP/GDRFA system.", mandatory: true },
      { title: "Passport Copy & Expired Visa Page", description: "Proof of previous legal residency or visit status.", mandatory: true },
      { title: "Humanitarian Grounds / Justification Letter", description: "Explanation for delay (medical emergency, labor dispute, or employer abandonment).", mandatory: true },
      { title: "Supporting Evidence (Hospital records, court papers)", description: "Official documentation substantiating the appeal.", mandatory: false },
    ],
    faqs: [
      { question: "How much can overstay fines be reduced by?", answer: "Depending on the applicant's circumstances and immigration committee review, reductions typically range from 50% to 90% of the total accumulated overstay penalties." },
    ],
  },
  "out-pass-exit-clearance": {
    tagline: "Expedited immigration exit permits (Out Pass) enabling penalty-free travel for overstayers and status clears.",
    requiredDocuments: [
      { title: "Original Passport or Consulate Emergency Travel Certificate", description: "Official travel document issued by your national embassy.", mandatory: true },
      { title: "Confirmed One-Way Flight Ticket", description: "Air ticket departing from Abu Dhabi International Airport.", mandatory: true },
      { title: "Fine Settlement Receipt or Court Clearance", description: "Proof of approved waiver or penalty settlement.", mandatory: true },
    ],
    faqs: [
      { question: "How long is an Out Pass valid after issuance?", answer: "An Out Pass is typically valid for 7 to 14 days, during which the traveler must exit the UAE." },
    ],
  },

  /* =========================================================================
     3. Government Portals & PRO
     ========================================================================= */
  "tasheel-services-mohre": {
    tagline: "Direct Ministry of Human Resources & Emiratisation (MOHRE) corporate and labor contract processing.",
    requiredDocuments: [
      { title: "Valid Mainland Trade License", description: "Current commercial registration.", mandatory: true },
      { title: "Authorized Signatory E-Signature Card", description: "MOHRE digital signature credentials.", mandatory: true },
      { title: "Employee Passport & White Background Photo", description: "Valid passport with at least 6 months validity.", mandatory: true },
      { title: "Attested Degree (for skilled professions)", description: "MOFA-attested academic qualification.", mandatory: false },
    ],
    faqs: [
      { question: "What transactions are handled via Tasheel?", answer: "Tasheel handles new electronic work permits, contract renewals, labor card cancellations, establishment quota modifications, and absconding complaints." },
    ],
  },
  "tamm-services-abu-dhabi": {
    tagline: "One-stop integration with official Abu Dhabi Government services, permits, and municipal approvals.",
    requiredDocuments: [
      { title: "Active UAE PASS Account", description: "Verified digital identity login.", mandatory: true },
      { title: "Trade License / Emirates ID", description: "Commercial or personal identifier.", mandatory: true },
      { title: "Specific Permit Application Details", description: "Details of the governmental service requested.", mandatory: true },
    ],
    faqs: [
      { question: "What can ABC Typing process through TAMM?", answer: "We process ADDED commercial license renewals, amendments, economic permits, civil defense NOCs, and municipal approvals." },
    ],
  },
  "tawjeeh-services": {
    tagline: "Mandatory labor awareness training sessions and contract delivery for newly hired UAE mainland workers.",
    requiredDocuments: [
      { title: "MOHRE Work Permit Reference Number", description: "Official ministerial application code.", mandatory: true },
      { title: "Employee Original Passport & Entry Permit", description: "Identification documents of the newly arrived worker.", mandatory: true },
    ],
    faqs: [
      { question: "Is Tawjeeh attendance mandatory for all employees?", answer: "Attendance is compulsory for workers in skill levels 3, 4, and 5 to educate them on their rights, obligations, and UAE labor laws." },
    ],
  },
  "tadbeer-services": {
    tagline: "Official processing for domestic workers, maids, private drivers, and household staff contracts.",
    requiredDocuments: [
      { title: "Sponsor Emirates ID & Salary Certificate", description: "Proof of financial eligibility.", mandatory: true },
      { title: "Domestic Worker Medical Fitness Result", description: "Passed medical test in UAE center.", mandatory: true },
      { title: "Standard Tadbeer Employment Contract", description: "Official tri-party domestic contract.", mandatory: true },
    ],
    faqs: [
      { question: "Does Tadbeer handle medical insurance for maids?", answer: "Yes, mandatory health insurance coverage is bundled during contract and visa issuance." },
    ],
  },
  "municipality-services": {
    tagline: "Abu Dhabi City Municipality site plans, commercial shop signage approvals, and building permits.",
    requiredDocuments: [
      { title: "Premises Tawtheeq Contract", description: "Official registered lease agreement.", mandatory: true },
      { title: "Trade License Copy", description: "Commercial entity registration.", mandatory: true },
      { title: "Architectural Drawing / Signage Mockup", description: "Technical specifications for municipal review.", mandatory: true },
    ],
    faqs: [
      { question: "Do all commercial shop signboards require municipality permits?", answer: "Yes, all exterior shop signage, advertising banners, and promotional facades must receive municipal approval before installation." },
    ],
  },
  "tawteek-work-tawtheeq": {
    tagline: "Official registration and renewal of residential and commercial lease contracts in Abu Dhabi.",
    requiredDocuments: [
      { title: "Property Title Deed (Land / Building Owner)", description: "Official Land Department ownership proof.", mandatory: true },
      { title: "Landlord & Tenant Emirates IDs", description: "Identification of all contract parties.", mandatory: true },
      { title: "Trade License (for Commercial Leases)", description: "Required for corporate office leases.", mandatory: false },
    ],
    faqs: [
      { question: "Why is a Tawtheeq contract mandatory?", answer: "Tawtheeq is compulsory in Abu Dhabi for sponsoring family members, renewing trade licenses, installing utility meters, and opening bank accounts." },
    ],
  },
  "adnoc-registration": {
    tagline: "Full vendor registration, Supreme Petroleum Council (SPC) approvals, and ADNOC prequalification.",
    requiredDocuments: [
      { title: "Trade License with Oil & Gas Activity Codes", description: "Approved commercial license.", mandatory: true },
      { title: "In-Country Value (ICV) Certificate", description: "Official audited ICV score score sheet.", mandatory: true },
      { title: "Company Profile & Quality Management Certifications (ISO)", description: "Technical capability portfolio.", mandatory: true },
      { title: "3 Years Audited Financial Statements", description: "Certified financial balance sheets.", mandatory: true },
    ],
    faqs: [
      { question: "Can foreign companies register directly with ADNOC?", answer: "Foreign entities must either establish a mainland Abu Dhabi branch or partner with a registered commercial agent to participate in ADNOC tenders." },
    ],
  },
  "government-entity-approvals-nocs": {
    tagline: "Expedited Non-Objection Certificates from Civil Defense, Police, Transport, and Health Authorities.",
    requiredDocuments: [
      { title: "Trade License or Initial Approval", description: "Current commercial registration.", mandatory: true },
      { title: "Premises Layout & Engineering Diagrams", description: "Required for Civil Defense and industrial NOCs.", mandatory: true },
      { title: "Request Letter Addressed to Specific Entity", description: "Formal statement of required clearances.", mandatory: true },
    ],
    faqs: [
      { question: "How long does a Civil Defense NOC take?", answer: "Following premises inspection and compliance clearance, approvals are typically granted within 3 to 7 business days." },
    ],
  },

  /* =========================================================================
     4. Foreign Visas & Travel
     ========================================================================= */
  "american-visa-us": {
    tagline: "Accurate DS-160 application drafting, appointment booking, and interview preparation for US B1/B2 visas.",
    requiredDocuments: [
      { title: "Valid Passport (Minimum 6 Months Validity)", description: "Must have at least 2 blank visa pages.", mandatory: true },
      { title: "Completed DS-160 Application Confirmation", description: "Official electronic confirmation barcode.", mandatory: true },
      { title: "2x2 Inch US Specification Photograph", description: "Square format with white background.", mandatory: true },
      { title: "6-Month Stamped Bank Statements", description: "Demonstrating financial stability and ties to the UAE.", mandatory: true },
      { title: "Employer NOC Letter / Trade License", description: "Confirming employment designation, salary, and authorized leave.", mandatory: true },
    ],
    faqs: [
      { question: "Can ABC Typing expedite US visa interview dates?", answer: "We monitor consulate interview cancellation slots daily to reschedule and secure significantly earlier interview appointments." },
    ],
  },
  "schengen-visa-europe": {
    tagline: "Guaranteed document compliance, flight/hotel bookings, travel insurance, and VFS/BLS appointments.",
    requiredDocuments: [
      { title: "Valid Passport & UAE Residence Visa (3+ Months Validity)", description: "Original passport and valid UAE residency.", mandatory: true },
      { title: "6-Month Original Stamped Bank Statements", description: "Demonstrating sufficient travel funds.", mandatory: true },
      { title: "Employer No-Objection Certificate (NOC)", description: "On official company letterhead signed by authorized manager.", mandatory: true },
      { title: "Travel Medical Insurance (€30,000 Minimum Coverage)", description: "Covering all Schengen territory for the entire trip duration.", mandatory: true },
      { title: "Confirmed Flight Itinerary & Hotel Vouchers", description: "Round-trip flight booking and hotel reservations.", mandatory: true },
    ],
    faqs: [
      { question: "Which Schengen country should I apply to?", answer: "You must apply to the embassy of the country that is your primary destination (where you will spend the most nights) or your first point of entry." },
    ],
  },
  "canada-visa": {
    tagline: "Comprehensive Canada visitor visa (TRV) application filing, family profiles, and biometrics scheduling.",
    requiredDocuments: [
      { title: "Valid Passport Scan & Travel History", description: "Including all previous international visa stamps.", mandatory: true },
      { title: "Proof of Financial Support & Stamped Bank Statements", description: "6 months of personal or corporate banking statements.", mandatory: true },
      { title: "Employment Letter / Commercial Registration", description: "Demonstrating strong employment and ties to UAE.", mandatory: true },
      { title: "Detailed Travel Itinerary & Purpose of Visit", description: "Invitation letter or holiday itinerary.", mandatory: true },
    ],
    faqs: [
      { question: "How long is a Canadian visitor visa issued for?", answer: "Visas are typically granted as multiple-entry permits valid up to the expiration date of your passport (up to 10 years)." },
    ],
  },
  "saudi-visa-ksa": {
    tagline: "Instant Saudi Tourist E-Visa, Commercial Business Visa, and GCC Resident E-Visas within 24 hours.",
    requiredDocuments: [
      { title: "Valid Passport Copy (6+ Months Validity)", description: "Clear color scan.", mandatory: true },
      { title: "UAE Residence Visa Copy (3+ Months Validity)", description: "Required for GCC resident visa route.", mandatory: true },
      { title: "Passport Size Color Photograph", description: "White background digital photo.", mandatory: true },
    ],
    faqs: [
      { question: "Can UAE residents get instant Saudi visas online?", answer: "Yes. UAE residents with valid residence visas can receive multiple-entry Saudi tourist e-visas valid for 1 year within 24 hours." },
    ],
  },
  "foreign-visa-assistance": {
    tagline: "Professional visa documentation, appointment scheduling, and consultation for over 50 global destinations.",
    requiredDocuments: [
      { title: "Valid Passport & UAE Residence Visa", description: "Minimum 6 months validity.", mandatory: true },
      { title: "Financial & Employment Proof", description: "Bank statements, salary certificate, or trade license.", mandatory: true },
    ],
    faqs: [
      { question: "Which countries require physical embassy visits?", answer: "Countries requiring biometrics (UK, USA, Canada, Schengen) require in-person attendance at centers like VFS or TLS." },
    ],
  },
  "travel-desk-ticket-booking": {
    tagline: "Flight ticketing, worldwide hotel reservations, and visa-compliant verifiable travel itineraries.",
    requiredDocuments: [
      { title: "Traveler Passport Copy", description: "Accurate full legal name as written in passport.", mandatory: true },
      { title: "Preferred Travel Dates & Route", description: "Departure, destination, and return timing.", mandatory: true },
    ],
    faqs: [
      { question: "Are your flight bookings verifiable for visa applications?", answer: "Yes, all flight itineraries carry live PNR codes that can be verified directly on the airline's official website." },
    ],
  },

  /* =========================================================================
     5. Legal, Attestation & Translation
     ========================================================================= */
  "certificate-attestation-mofa-embassy": {
    tagline: "Official Ministry of Foreign Affairs (MOFA) and international embassy legalization for degrees and certificates.",
    requiredDocuments: [
      { title: "Original Degree, Birth, or Marriage Certificate", description: "Document requiring legal attestation.", mandatory: true },
      { title: "Home Country Foreign Affairs Stamp", description: "Pre-attested by home country government bodies (HRD/MEA/State).", mandatory: true },
      { title: "UAE Embassy Stamp in Country of Origin", description: "Legalization from the UAE diplomatic mission abroad.", mandatory: true },
      { title: "Passport Copy of Certificate Holder", description: "Valid passport identification.", mandatory: true },
    ],
    faqs: [
      { question: "How long does complete overseas attestation take?", answer: "Standard overseas embassy and home country attestation takes 7 to 15 working days. Urgent express couriered processing takes 4 to 6 working days." },
    ],
  },
  "certificate-equivalency-services": {
    tagline: "Ministry of Education (MOE) equivalency certificates for foreign degrees and academic qualifications.",
    requiredDocuments: [
      { title: "MOFA-Attested Original Degree Certificate", description: "Fully legalized academic credential.", mandatory: true },
      { title: "Original Academic Transcripts", description: "Attested university mark sheets and grade transcripts.", mandatory: true },
      { title: "Genuineness Verification / Dataflow Report", description: "Primary source verification confirmation.", mandatory: true },
      { title: "Emirates ID & UAE Residence Visa Copy", description: "Applicant identification.", mandatory: true },
    ],
    faqs: [
      { question: "Why is degree equivalency required in the UAE?", answer: "Degree equivalency is mandatory for employment in government entities, teaching positions, engineering accreditation, and Golden Visa applications." },
    ],
  },
  "genuineness-certificate": {
    tagline: "Official university verification and Embassy authenticity letters confirming valid academic credentials.",
    requiredDocuments: [
      { title: "Degree Certificate & Final Transcripts", description: "Clear copies of graduation documents.", mandatory: true },
      { title: "Student ID / University Roll Number", description: "Institutional reference identifier.", mandatory: true },
      { title: "Consent Letter for Verification", description: "Signed authorization to contact the awarding university.", mandatory: true },
    ],
    faqs: [
      { question: "Who requests a genuineness verification certificate?", answer: "Foreign embassies, UAE licensing boards (DOH, DHA), and MOE require third-party genuineness confirmation prior to equivalency." },
    ],
  },
  "legal-arabic-english-translation": {
    tagline: "Ministry of Justice certified Arabic and English legal translation accepted by UAE courts and government.",
    requiredDocuments: [
      { title: "Original Document or Clear High-Resolution Scan", description: "Contracts, court judgments, certificates, or corporate records.", mandatory: true },
    ],
    faqs: [
      { question: "Is your legal translation accepted in UAE courts and ministries?", answer: "Yes, our sworn legal translators are certified by the UAE Ministry of Justice, ensuring 100% acceptance across all government departments." },
    ],
  },
  "notary-services-abu-dhabi": {
    tagline: "Fast-track remote and in-person notarization of Powers of Attorney, corporate resolutions, and contracts.",
    requiredDocuments: [
      { title: "Draft Power of Attorney (POA) or Contract in Arabic", description: "Bilingual legal text ready for notarization.", mandatory: true },
      { title: "Principal & Agent Emirates IDs and Passports", description: "Identification for all signing parties.", mandatory: true },
      { title: "Active UAE PASS Account", description: "Required for digital video notarization.", mandatory: true },
    ],
    faqs: [
      { question: "Can notarization be completed without physically visiting the court?", answer: "Yes, through Abu Dhabi Judicial Department (ADJD) digital notarization, parties can complete signing via official video call." },
    ],
  },
  "police-clearance-certificate-pcc": {
    tagline: "Official Good Conduct Certificate issued by Abu Dhabi Police & Ministry of Interior (MOI) within 24 hours.",
    requiredDocuments: [
      { title: "Valid Emirates ID or Unified Number (UID)", description: "Identification number.", mandatory: true },
      { title: "Active UAE PASS Credentials", description: "For portal verification.", mandatory: true },
      { title: "Purpose of Certificate", description: "Specify immigration, employment, or foreign embassy submission.", mandatory: true },
    ],
    faqs: [
      { question: "Can a former resident outside the UAE obtain a UAE PCC?", answer: "Yes, former residents can provide fingerprint cards attested by the UAE Embassy in their country to obtain a certified PCC." },
    ],
  },
  "legal-court-services": {
    tagline: "Court case registration, memo drafting, petition submissions, and judicial execution follow-up.",
    requiredDocuments: [
      { title: "Case Documentation & Commercial Dispute File", description: "Invoices, agreements, and payment dispute proofs.", mandatory: true },
      { title: "Plaintiff & Defendant Identification Details", description: "Emirates IDs, trade licenses, or passport records.", mandatory: true },
      { title: "Power of Attorney (POA)", description: "Notarized authorization for court filings.", mandatory: true },
    ],
    faqs: [
      { question: "Do you handle labor court disputes?", answer: "Yes, we handle the preliminary mediation filing through MOHRE and subsequent referral to the Abu Dhabi Labor Court." },
    ],
  },

  /* =========================================================================
     6. Traffic, Vehicles & Tolls
     ========================================================================= */
  "traffic-dept-work": {
    tagline: "Expedited vehicle registration renewals, fine settlements, and traffic file updates with Abu Dhabi Police.",
    requiredDocuments: [
      { title: "Vehicle Registration Card (Mulkiya)", description: "Current or expired vehicle card.", mandatory: true },
      { title: "Passed Vehicle Technical Inspection Certificate", description: "Testing report from ADNOC Vehicle Inspection center.", mandatory: true },
      { title: "Valid Vehicle Insurance Policy", description: "Minimum 13-month comprehensive or third-party insurance.", mandatory: true },
      { title: "Owner Emirates ID & Traffic File Number (TCF)", description: "Owner identification credentials.", mandatory: true },
    ],
    faqs: [
      { question: "Can an expired Mulkiya be renewed with traffic fines?", answer: "All outstanding traffic fines must be cleared or scheduled for payment before the technical renewal certificate can be issued." },
    ],
  },
  "vehicle-services-abu-dhabi": {
    tagline: "Ownership transfers, export plates, number plate retention, and commercial fleet registration.",
    requiredDocuments: [
      { title: "Original Mulkiya & Vehicle Inspection Report", description: "Testing clearance.", mandatory: true },
      { title: "Buyer & Seller Emirates IDs", description: "Personal identification for title transfer.", mandatory: true },
      { title: "New Buyer Vehicle Insurance", description: "Active insurance registered in buyer's name.", mandatory: true },
    ],
    faqs: [
      { question: "Do both buyer and seller need to visit the traffic center?", answer: "With verified UAE PASS digital authentication, vehicle title transfers can be executed 100% online through our portal." },
    ],
  },
  "abu-dhabi-driving-license": {
    tagline: "Driving file opening, foreign license conversion, and renewal typing for Abu Dhabi driving licenses.",
    requiredDocuments: [
      { title: "Original Emirates ID", description: "Valid resident identification.", mandatory: true },
      { title: "Accredited Eye Test Certificate", description: "Conducted at an approved optical center.", mandatory: true },
      { title: "Original Foreign Driving License (for conversion)", description: "From recognized eligible countries (EU, USA, GCC, UK, etc.).", mandatory: false },
      { title: "Legal Arabic Translation of License", description: "Required if original license is not in English or Arabic.", mandatory: false },
    ],
    faqs: [
      { question: "Which nationalities can directly swap their driving license without tests?", answer: "Holders of licenses from GCC countries, the USA, UK, Canada, Australia, Japan, and most European Union nations can directly convert to an Abu Dhabi license." },
    ],
  },
  "abu-dhabi-police-security-for-vehicle": {
    tagline: "Security permits, vehicle tracking approvals, and specialized transport clearances with Abu Dhabi Police.",
    requiredDocuments: [
      { title: "Commercial Trade License Copy", description: "Company registration.", mandatory: true },
      { title: "Vehicle Registration & Mulkiya", description: "Official vehicle documents.", mandatory: true },
      { title: "Driver Emirates ID & Police Clearance", description: "Driver credential verification.", mandatory: true },
    ],
    faqs: [
      { question: "When is police security clearance mandatory for vehicles?", answer: "Mandatory for commercial transport vehicles carrying hazardous materials, industrial chemicals, or operating in protected coastal/energy zones." },
    ],
  },
  "darb-toll-registration": {
    tagline: "Instant Abu Dhabi DARB toll gate account setup, vehicle linking, and balance recharge services.",
    requiredDocuments: [
      { title: "Traffic File Number (TCF)", description: "Found on driving license or Mulkiya.", mandatory: true },
      { title: "Vehicle Plate Details (Emirate, Code & Number)", description: "Registration plate identifier.", mandatory: true },
      { title: "Emirates ID & Mobile Number", description: "For verification OTPs.", mandatory: true },
    ],
    faqs: [
      { question: "When are DARB toll gates active in Abu Dhabi?", answer: "Toll charges (AED 4) apply during peak hours: Monday to Saturday from 7:00 AM to 9:00 AM and 5:00 PM to 7:00 PM. Sundays and public holidays are free." },
    ],
  },
  "salik-registration": {
    tagline: "Dubai Salik tag purchasing, online account activation, vehicle linking, and automated balance top-ups.",
    requiredDocuments: [
      { title: "Vehicle Mulkiya (Registration Card)", description: "Details of the vehicle being registered.", mandatory: true },
      { title: "Owner Emirates ID & Mobile Number", description: "Owner contact credentials.", mandatory: true },
    ],
    faqs: [
      { question: "How quickly does a new Salik tag activate?", answer: "Once registered, your tag activates immediately on the RTA system, allowing you to pass Dubai toll gates without fines." },
    ],
  },
  "itc-services-transport": {
    tagline: "Integrated Transport Centre (ITC) commercial permits, taxi/bus licensing, and heavy transport clearances.",
    requiredDocuments: [
      { title: "Trade License with Transport Activity Codes", description: "Commercial authorization.", mandatory: true },
      { title: "Fleet Vehicle Registration Details", description: "All vehicles under the commercial permit.", mandatory: true },
      { title: "Driver Professional Permits", description: "ITC-approved commercial driver cards.", mandatory: true },
    ],
    faqs: [
      { question: "Do commercial delivery vehicles require ITC permits?", answer: "Yes, all commercial cargo, freight, and motorcycle delivery fleets in Abu Dhabi must obtain official ITC operating permits." },
    ],
  },
  "asateel-work-fleet-tracking": {
    tagline: "Mandatory Abu Dhabi Asateel platform registration, GPS tracking device certification, and fleet compliance.",
    requiredDocuments: [
      { title: "Commercial Trade License", description: "Company transport license.", mandatory: true },
      { title: "Approved GPS Tracking Installation Certificate", description: "Issued by an Asateel-certified tracking provider.", mandatory: true },
      { title: "Fleet Registration List (Mulkiya copies)", description: "Vehicles to be connected to the central monitoring gateway.", mandatory: true },
    ],
    faqs: [
      { question: "What happens if a transport company does not register with Asateel?", answer: "Commercial vehicles will not be allowed to renew their Mulkiyas or ITC transport permits without active Asateel certification." },
    ],
  },

  /* =========================================================================
     7. Labor, Payroll & Insurance
     ========================================================================= */
  "wps-service-wage-protection": {
    tagline: "WPS electronic payroll compliance, SIF file generation, and labor wage delay resolution with Central Bank.",
    requiredDocuments: [
      { title: "MOHRE Establishment Card", description: "Company labor file reference.", mandatory: true },
      { title: "Corporate Bank Account Details & Routing Code", description: "WPS-registered bank or exchange house.", mandatory: true },
      { title: "Employee Payroll List (Names, Personal Numbers, Salaries)", description: "Matching registered MOHRE labor contracts.", mandatory: true },
    ],
    faqs: [
      { question: "What percentage of employees must be paid through WPS to avoid fines?", answer: "Companies must disburse at least 90% of their total workforce salaries within the statutory deadlines to avoid severe MOHRE blocks and fines." },
    ],
  },
  "wp-insurance-work-permit": {
    tagline: "Cost-effective Work Permit insurance replacement scheme replacing traditional AED 3,000 bank guarantees.",
    requiredDocuments: [
      { title: "Company Trade License Copy", description: "Valid mainland commercial license.", mandatory: true },
      { title: "MOHRE Work Permit Application Reference", description: "New or renewal permit code.", mandatory: true },
      { title: "Worker Passport Copy", description: "Identification for policy coverage.", mandatory: true },
    ],
    faqs: [
      { question: "What does Work Permit insurance cover?", answer: "The policy covers employee unpaid wages, end-of-service gratuity, and repatriation flights up to AED 20,000 per worker." },
    ],
  },
  "iloe-insurance-job-loss": {
    tagline: "Mandatory Involuntary Loss of Employment (ILOE) insurance registration for private and public sector employees.",
    requiredDocuments: [
      { title: "Emirates ID Number", description: "Valid resident ID.", mandatory: true },
      { title: "Unified Number (UID) / Labor Card Number", description: "For employment verification.", mandatory: true },
      { title: "Active UAE Mobile Phone Number", description: "To receive policy SMS and confirmation.", mandatory: true },
    ],
    faqs: [
      { question: "What is the penalty for not subscribing to ILOE?", answer: "Failure to subscribe to the mandatory ILOE scheme results in an automatic fine of AED 400 imposed by MOHRE." },
    ],
  },
  "health-vehicle-insurance": {
    tagline: "Comprehensive medical health insurance plans (Basic, Enhanced, VIP) and comprehensive vehicle insurance.",
    requiredDocuments: [
      { title: "Emirates ID Copy & Passport Copy", description: "For medical insurance applicants.", mandatory: true },
      { title: "Vehicle Registration Card (Mulkiya)", description: "For automotive insurance coverage.", mandatory: false },
      { title: "Previous Insurance Policy (for No-Claim Discount)", description: "Proof of clean driving record.", mandatory: false },
    ],
    faqs: [
      { question: "Is health insurance mandatory in Abu Dhabi?", answer: "Yes, health insurance is legally mandatory for all Abu Dhabi residents, sponsored family members, and employees." },
    ],
  },
  "general-insurance-services": {
    tagline: "Commercial property, workmen's compensation, public liability, and marine cargo insurance policies.",
    requiredDocuments: [
      { title: "Trade License & Company Profile", description: "Commercial entity details.", mandatory: true },
      { title: "Premises / Asset Details & Estimated Valuation", description: "Inventory, facility, or asset specifications.", mandatory: true },
    ],
    faqs: [
      { question: "Do corporate leases require public liability insurance?", answer: "Most commercial building landlords and free zone authorities mandate public liability insurance before issuing lease contracts." },
    ],
  },

  /* =========================================================================
     8. Professional Licensing & Compliance
     ========================================================================= */
  "cicpa-pass-cna-port-passes": {
    tagline: "Expedited Critical National Infrastructure Authority (CICPA) and Port security security passes.",
    requiredDocuments: [
      { title: "Supreme Petroleum Council (SPC) / Project Award Contract", description: "Proof of assignment in designated critical zone.", mandatory: true },
      { title: "Company Trade License & CICPA Company Registration", description: "Approved security contractor file.", mandatory: true },
      { title: "Employee Passport Copy, Visa & Police Clearance", description: "Security screening documentation.", mandatory: true },
    ],
    faqs: [
      { question: "How long does a CICPA security pass take?", answer: "Security vetting and final biometric pass issuance typically takes 10 to 20 working days following official submission." },
    ],
  },
  "aml-registration-goaml": {
    tagline: "Mandatory FIU goAML anti-money laundering reporting portal setup and compliance filing for DNFBPs.",
    requiredDocuments: [
      { title: "Trade License with Designated Non-Financial Activity (DNFBP)", description: "Real estate, gold/precious metals, auditing, or legal services.", mandatory: true },
      { title: "Compliance Officer Passport, Emirates ID & CV", description: "Appointed AML officer profile.", mandatory: true },
      { title: "Official Authorization Letter on Company Letterhead", description: "Designating the goAML administrator.", mandatory: true },
    ],
    faqs: [
      { question: "Who must register on the goAML portal?", answer: "Real estate brokers, corporate service providers, auditors, precious metal dealers, and lawyers are legally required to register under UAE AML laws." },
    ],
  },
  "medical-professional-licensing-dohdha": {
    tagline: "Doctors, dentists, nurses, and allied health professional licensing through Department of Health (DOH).",
    requiredDocuments: [
      { title: "Recognized Medical Degree & Official Transcripts", description: "Accredited educational qualifications.", mandatory: true },
      { title: "Primary Source Verification (Dataflow PSV Report)", description: "Verified background screening.", mandatory: true },
      { title: "Valid Home Country Medical License & Certificate of Good Standing", description: "Issued within the past 6 months.", mandatory: true },
      { title: "Clinical Experience Logbooks (2–5 Years Experience)", description: "Demonstrating clinical competency.", mandatory: true },
    ],
    faqs: [
      { question: "Can a DHA (Dubai) license be converted to a DOH (Abu Dhabi) license?", answer: "Yes, licensed healthcare professionals can transfer their medical credentials across emirates through the unified national healthcare portal." },
    ],
  },
  "engineer-license-registration": {
    tagline: "Abu Dhabi Department of Municipalities and Transport (DMT) engineering society membership and licensing.",
    requiredDocuments: [
      { title: "Attested Engineering Degree Certificate", description: "Legalized by MOFA with UAE equivalency.", mandatory: true },
      { title: "Society of Engineers (SOE) Membership Card", description: "Active UAE SOE accreditation.", mandatory: true },
      { title: "Emirates ID & Residence Visa Copy", description: "Applicant identification.", mandatory: true },
      { title: "Employing Engineering Firm Trade License", description: "Hiring engineering consultancy or contracting firm.", mandatory: true },
    ],
    faqs: [
      { question: "Is engineering licensing mandatory for engineers signing construction drawings?", answer: "Yes, only registered and DMT-licensed engineers are legally permitted to submit architectural and structural designs in Abu Dhabi." },
    ],
  },
  "icv-certification": {
    tagline: "In-Country Value (ICV) financial audit coordination to boost tender scoring for ADNOC and government projects.",
    requiredDocuments: [
      { title: "Audited Financial Statements (Prepared by Accredited Auditor)", description: "Standardized IFRS financial statements.", mandatory: true },
      { title: "Detailed Supplier Spend Breakdown & Emiratisation Payroll", description: "Local procurement and workforce records.", mandatory: true },
      { title: "Valid Trade License & Establishment Documents", description: "Corporate formation papers.", mandatory: true },
    ],
    faqs: [
      { question: "What is the benefit of a high ICV score?", answer: "Higher ICV scores give contractors and suppliers significant competitive price-weighting advantages during government and semi-government tender evaluations." },
    ],
  },
  "iso-certification": {
    tagline: "ISO 9001 (Quality), ISO 14001 (Environment), and ISO 45001 (OH&S) audit preparation and certification.",
    requiredDocuments: [
      { title: "Company Trade License & Organization Chart", description: "Business structure details.", mandatory: true },
      { title: "Standard Operating Procedures (SOPs) & Manuals", description: "Operational policy documentation.", mandatory: true },
    ],
    faqs: [
      { question: "How long is an ISO certification valid?", answer: "ISO certificates are valid for 3 years, subject to successful annual surveillance audits." },
    ],
  },

  /* =========================================================================
     9. Typing & Office Services
     ========================================================================= */
  "arabic-english-typing": {
    tagline: "Precision bilingual Arabic and English document drafting, ministerial correspondence, and official petitions.",
    requiredDocuments: [
      { title: "Draft Text, Handwritten Notes, or Reference File", description: "Content to be professionally typed.", mandatory: true },
      { title: "Relevant Applicant Identification", description: "Passport or Emirates ID if typing official legal memos.", mandatory: false },
    ],
    faqs: [
      { question: "Do you provide urgent same-hour typing services?", answer: "Yes, our certified typists can format, translate, and finalize official letters and applications while you wait." },
    ],
  },
  "transactions-follow-up": {
    tagline: "Dedicated on-ground PRO representation to resolve blocked, rejected, or delayed ministry transactions.",
    requiredDocuments: [
      { title: "Transaction Application Number / Portal Reference", description: "Existing pending filing code.", mandatory: true },
      { title: "Rejection Notice or Department Comment Screen", description: "Specific grounds cited by the government authority.", mandatory: true },
      { title: "Supporting Clarification Documents", description: "Corrected files to resolve ministerial queries.", mandatory: false },
    ],
    faqs: [
      { question: "How quickly can you attend government departments in Abu Dhabi?", answer: "Our PROs visit municipal, labor, and economic department service centers daily to expedite transaction approvals." },
    ],
  },
  "professional-cv-writing": {
    tagline: "Executive ATS-optimized curriculum vitae drafting tailored to the UAE and Gulf corporate job market.",
    requiredDocuments: [
      { title: "Current CV, Resume, or Career History Notes", description: "Existing employment details and dates.", mandatory: true },
      { title: "Target Job Roles & Industry Preferences", description: "Target designations and sectors in UAE/Gulf.", mandatory: true },
    ],
    faqs: [
      { question: "Are your CVs compatible with Applicant Tracking Systems (ATS)?", answer: "Yes, all resumes are engineered with industry-specific keywords, clean formatting, and structured metadata to score highly on corporate ATS scanners." },
    ],
  },
  "print-color-and-black": {
    tagline: "High-speed digital printing, architectural drawing plotting, document scanning, and thermal binding.",
    requiredDocuments: [
      { title: "Digital File (PDF, DOCX, JPEG, CAD)", description: "Supplied via WhatsApp, email, or USB flash drive.", mandatory: true },
    ],
    faqs: [
      { question: "What sizes of architectural plans can you print?", answer: "We print all standard and large-format architectural blueprints from A4 and A3 up to A0 and custom banner roll sizes." },
    ],
  },
  "digital-marketing-abu-dhabi": {
    tagline: "Targeted Google Ads, local SEO, social media management, and website development for UAE businesses.",
    requiredDocuments: [
      { title: "Company Profile & Website (if existing)", description: "Current brand collateral.", mandatory: true },
      { title: "Target Audience & Service Goals", description: "Key customer demographics and services to promote.", mandatory: true },
    ],
    faqs: [
      { question: "How do you help local UAE businesses acquire inbound leads?", answer: "We implement hyper-local Google Search campaigns, optimize Google Business Profiles for Maps visibility, and target verified UAE decision-makers on LinkedIn and Meta." },
    ],
  },
};

// Generic template showcase details
export const TEMPLATE_SERVICE_DETAIL: ServiceDetail = {
  slug: "template",
  id: "template-showcase",
  name: "Service Details Page Template",
  category: {
    id: "business-setup",
    name: "Business Setup & Corporate",
    shortName: "Business Setup",
  },
  tagline:
    "Standardized, high-conversion service blueprint engineered for all typing, residency, corporate, and governmental clearance services.",
  requiredDocuments: [
    {
      title: "Valid Passport Copy",
      description: "Clear color scan with at least 6 months validity.",
      mandatory: true,
    },
    {
      title: "Emirates ID (Front & Back)",
      description: "Applicable for existing residents and national sponsors.",
      mandatory: true,
    },
    {
      title: "Trade License / Corporate Registration",
      description: "For corporate filings, company setups, or commercial clearances.",
      mandatory: false,
    },
    {
      title: "Attested Supporting Certificates",
      description: "MOFA-attested degrees, marriage/birth certificates, or board resolutions.",
      mandatory: false,
    },
  ],
  faqs: [
    {
      question: "How does ABC Typing guarantee hassle-free processing?",
      answer:
        "With over 20 years of continuous operation in Kerala and the UAE, our licensed bilingual PRO team has direct gateway access to all UAE government departments, ensuring applications comply 100% with current federal laws before submission.",
    },
    {
      question: "Can this service be completed remotely without visiting the office?",
      answer:
        "Yes! More than 90% of our services can be completed 100% digitally through secure WhatsApp document sharing and online payment options.",
    },
    {
      question: "What happens if additional government approvals are required?",
      answer:
        "Our PRO team coordinates directly with the respective UAE ministries (Civil Defense, Municipality, Police, MOHRE) to obtain necessary NOCs without unnecessary delays.",
    },
  ],
};

// Smart fallback generator for all 69 services
export function getServiceDetail(slugOrName: string): ServiceDetail {
  const normalizedSlug = slugify(slugOrName);

  if (normalizedSlug === "template") {
    return TEMPLATE_SERVICE_DETAIL;
  }

  // Search across all categories
  let foundCategory: ServiceCategory | null = null;
  let foundService: ServiceItem | null = null;

  for (const cat of CATEGORIES) {
    for (const srv of cat.services) {
      if (
        slugify(srv.name) === normalizedSlug ||
        srv.id.toLowerCase() === slugOrName.toLowerCase() ||
        srv.name.toLowerCase() === slugOrName.toLowerCase()
      ) {
        foundCategory = cat;
        foundService = srv;
        break;
      }
    }
    if (foundService) break;
  }

  // Fallback service title if not explicitly found in categories
  const serviceName = foundService
    ? foundService.name
    : slugOrName
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

  const category = foundCategory || {
    id: "general-services",
    name: "Typing & Government Services",
    shortName: "General Services",
    description: "Professional government document processing across UAE.",
    services: [],
  };

  // Check if we have tailored content for this specific service
  const tailored = TAILORED_SERVICES[normalizedSlug];

  return {
    slug: normalizedSlug,
    id: foundService ? foundService.id : `srv-${normalizedSlug}`,
    name: serviceName,
    category: {
      id: category.id,
      name: category.name,
      shortName: category.shortName,
    },
    tagline:
      tailored?.tagline ||
      `Accurate, expedited ${serviceName} handling in Abu Dhabi and across the UAE with 100% compliance guarantee.`,
    requiredDocuments: tailored?.requiredDocuments || [
      {
        title: "Valid Passport & Visa Copy",
        description: "Clear colored scans of applicant / authorized signatory passport and residency visa.",
        mandatory: true,
      },
      {
        title: "Emirates ID Copy",
        description: "Front and back copy of current valid Emirates ID card (if resident).",
        mandatory: true,
      },
      {
        title: "Commercial License / Establishment Proof",
        description: "Required for corporate filings, company sponsorships, and business permits.",
        mandatory: category.id === "business-setup" || category.id === "gov-portals",
      },
      {
        title: "Supporting Notarized / Attested Files",
        description: "Specific documentation relevant to this service category (salary slip, MOA, tenancy, etc.).",
        mandatory: false,
      },
    ],
    faqs: tailored?.faqs || [
      {
        question: `How long does it take to process ${serviceName}?`,
        answer: `Under standard governmental operating conditions, processing typically takes 24 hours to 3 working days. Rush processing options are available upon consultation.`,
      },
      {
        question: "Can I initiate this service online without visiting your office?",
        answer:
          "Yes. You can submit your documents directly through our online enquiry form or WhatsApp, and our team will handle the entire submission remotely.",
      },
      {
        question: "What if my application has prior portal rejections or fines?",
        answer:
          "Our senior PRO team specializes in analyzing rejection reasons and submitting formal clarification appeals or fine exemption requests directly with government entities.",
      },
    ],
  };
}
