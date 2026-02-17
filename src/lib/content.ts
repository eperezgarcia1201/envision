export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/platform", label: "Platform" },
  { href: "/portal", label: "Portal" },
  { href: "/admin", label: "Admin" },
  { href: "/api-docs", label: "API Docs" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Login" },
];

export const capabilityPillars = [
  {
    title: "Confidential Field Operations",
    description:
      "Discreet maintenance execution for occupied, sensitive, and high-profile properties.",
  },
  {
    title: "Accountable Project Delivery",
    description:
      "Structured updates, milestone tracking, and quality-controlled closeout before handoff.",
  },
  {
    title: "Coverage Across Los Angeles",
    description:
      "Centralized dispatch and vetted teams serving multifamily, retail, and office portfolios.",
  },
  {
    title: "API-Ready Operating Model",
    description:
      "Service workflows designed today for tomorrow's integrations, billing systems, and SDK use.",
  },
];

export const serviceBlueprint = [
  {
    slug: "commercial-cleaning",
    name: "Commercial Cleaning",
    summary:
      "Recurring cleaning playbooks and onsite quality checks for business-critical spaces.",
    responseSlaHours: 8,
    coverageArea: "Los Angeles + San Fernando Valley",
    startingPrice: "$690/mo",
    featured: true,
  },
  {
    slug: "post-construction",
    name: "Post-Construction Cleanup",
    summary:
      "Detailed cleanup and debris management for remodel and tenant-improvement projects.",
    responseSlaHours: 6,
    coverageArea: "Greater Los Angeles",
    startingPrice: "$1,100/mo",
    featured: true,
  },
  {
    slug: "emergency-response",
    name: "Emergency Service Response",
    summary:
      "24/7 triage and rapid dispatch for urgent maintenance and restoration events.",
    responseSlaHours: 2,
    coverageArea: "LA County",
    startingPrice: "$1,250/mo",
    featured: true,
  },
  {
    slug: "property-turnover",
    name: "Property Turnover",
    summary:
      "Turn-ready workflow for multifamily and mixed-use properties with punch-list support.",
    responseSlaHours: 8,
    coverageArea: "LA Metro + South Bay",
    startingPrice: "$890/mo",
    featured: false,
  },
  {
    slug: "remodeling-repairs",
    name: "Remodeling and Repairs",
    summary:
      "Coordinated scopes for repairs, renovations, and finishes with controlled timelines.",
    responseSlaHours: 24,
    coverageArea: "Los Angeles County",
    startingPrice: "$1,950/mo",
    featured: false,
  },
  {
    slug: "preventive-maintenance",
    name: "Preventive Maintenance",
    summary:
      "Preventive visits, work-order forecasting, and recurring reports for asset longevity.",
    responseSlaHours: 24,
    coverageArea: "Los Angeles + Orange County",
    startingPrice: "$1,450/mo",
    featured: false,
  },
];

export const platformModules = [
  {
    title: "Work Order Core",
    copy: "Central queue, SLA tracking, assignment logic, and completion evidence for every job.",
  },
  {
    title: "Billing and Payments APIs",
    copy: "Future-ready payment workflows for invoice creation, status sync, and reconciliation.",
  },
  {
    title: "Client Portal",
    copy: "Live visibility for property managers across requests, schedules, photos, and approvals.",
  },
  {
    title: "Developer SDK Layer",
    copy: "Planned JavaScript, Android, and iOS SDKs to plug operational data into partner systems.",
  },
];

export const apiEndpointsPreview = [
  {
    method: "POST",
    path: "/api/auth/login",
    description: "Authenticate an operator and issue a secure session cookie.",
  },
  {
    method: "POST",
    path: "/api/auth/logout",
    description: "Invalidate the active session and clear browser credentials.",
  },
  {
    method: "GET",
    path: "/api/dashboard/overview",
    description: "Return CRM dashboard KPIs, pipeline metrics, and activity feed data.",
  },
  {
    method: "GET",
    path: "/api/health",
    description: "Read platform health and top-level operational counters.",
  },
  {
    method: "GET",
    path: "/api/leads?status=NEW",
    description: "List inbound leads by lifecycle stage (admin role required).",
  },
  {
    method: "POST",
    path: "/api/leads",
    description: "Create lead records from contact forms and partner channels.",
  },
  {
    method: "GET",
    path: "/api/work-orders?status=SCHEDULED",
    description: "Fetch work orders for operations views (admin/manager role required).",
  },
  {
    method: "GET",
    path: "/api/invoices?status=SENT",
    description: "Expose invoice pipeline for reporting (admin/manager role required).",
  },
  {
    method: "GET",
    path: "/api/clients",
    description: "List CRM clients with relationship counters (admin/manager role required).",
  },
  {
    method: "GET",
    path: "/api/properties",
    description: "List managed properties with manager details and activity counters.",
  },
  {
    method: "GET",
    path: "/api/estimates",
    description: "List estimate pipeline with conversion references (admin/manager role required).",
  },
  {
    method: "GET",
    path: "/api/employees",
    description: "List employees and assignment capacity metrics (admin/manager role required).",
  },
  {
    method: "GET",
    path: "/api/schedule",
    description: "Read dispatch schedule with assignee and work-order context.",
  },
  {
    method: "GET",
    path: "/api/users",
    description: "Admin-only endpoint to manage platform user accounts and roles.",
  },
  {
    method: "GET",
    path: "/api/service-packages",
    description: "Read and manage service package catalog entries.",
  },
  {
    method: "GET",
    path: "/api/invoices/:id/pdf",
    description: "Generate downloadable invoice PDF for billing and accounting workflows.",
  },
  {
    method: "GET",
    path: "/api/estimates/:id/pdf",
    description: "Generate downloadable quote/estimate PDF for client approvals.",
  },
];

export const roadmapMilestones = [
  {
    quarter: "Q2 2026",
    detail: "Launch v1 multi-page site, CRM capture, and internal operations dashboard.",
  },
  {
    quarter: "Q3 2026",
    detail: "Ship billing workflows and client portal updates with richer status notifications.",
  },
  {
    quarter: "Q4 2026",
    detail: "Release first API partner pilot and authentication layer for external integrations.",
  },
  {
    quarter: "Q1 2027",
    detail: "Introduce Android and iOS app foundations for field and manager experiences.",
  },
];

export const testimonials = [
  {
    quote:
      "Envision runs like an operations partner, not a generic contractor. Their reporting discipline is excellent.",
    author: "Portfolio Director, Multifamily Group",
  },
  {
    quote:
      "Response time and communication are consistent. We now standardize their team across all priority turnovers.",
    author: "Regional Property Manager, Retail Portfolio",
  },
];

export const galleryFallback = [
  {
    title: "Field Team Walkthrough",
    caption: "Pre-job scope alignment with manager and lead technician.",
    category: "Operations",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80",
    location: "Downtown Los Angeles",
  },
  {
    title: "Onsite Finishing",
    caption: "Renovation punch-list closeout and quality verification.",
    category: "Remodeling",
    imageUrl:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80",
    location: "Culver City",
  },
  {
    title: "Turnover Setup",
    caption: "Unit readiness checks before handoff.",
    category: "Property Turnover",
    imageUrl:
      "https://images.unsplash.com/photo-1560185009-5bf9f2849488?auto=format&fit=crop&w=1400&q=80",
    location: "Burbank",
  },
];
