import { hash } from "bcryptjs";
import {
  ActivitySeverity,
  AvailabilityType,
  BookingStatus,
  CampaignStatus,
  ChannelType,
  CheckInType,
  ContactStatus,
  EmployeeRole,
  EmployeeStatus,
  EstimateStatus,
  ExportStatus,
  IntegrationStatus,
  InvoiceStatus,
  LeadStatus,
  MessageStatus,
  OnboardingStatus,
  PaymentStatus,
  PayrollStatus,
  PrismaClient,
  Priority,
  ScheduleStatus,
  UserRole,
  WorkOrderStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

function dateAtOffset(daysOffset, hour = 9, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  await prisma.session.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.fieldCheckIn.deleteMany();
  await prisma.availabilityBlock.deleteMany();
  await prisma.payrollEntry.deleteMany();
  await prisma.payrollRun.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.messageLog.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.onboardingTask.deleteMany();
  await prisma.contactPerson.deleteMany();
  await prisma.bookingRequest.deleteMany();
  await prisma.scheduleItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.galleryAsset.deleteMany();
  await prisma.servicePackage.deleteMany();
  await prisma.integrationConnection.deleteMany();
  await prisma.planTier.deleteMany();
  await prisma.paymentProcessor.deleteMany();
  await prisma.exportJob.deleteMany();

  const adminPassword = process.env.ADMIN_PASSWORD ?? "1234qwer";
  const adminPasswordHash = await hash(adminPassword, 12);

  const managerPassword = process.env.MANAGER_PASSWORD ?? "1234qwer";
  const managerPasswordHash = await hash(managerPassword, 12);

  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      fullName: "Naomi Lee",
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      username: "operations",
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
      fullName: "Carlos Mendez",
    },
  });

  const [clientA, clientB, clientC, clientD, clientE] = await Promise.all([
    prisma.client.create({
      data: {
        companyName: "Sunset Medical Centers",
        contactName: "Naomi Lee",
        email: "naomi.lee@sunsetmedicalcenters.com",
        phone: "(323) 555-1240",
        tier: "Enterprise",
      },
    }),
    prisma.client.create({
      data: {
        companyName: "Apex Residential Group",
        contactName: "Maya Franklin",
        email: "maya.franklin@apexresidential.com",
        phone: "(323) 555-1020",
        tier: "Enterprise",
      },
    }),
    prisma.client.create({
      data: {
        companyName: "Harbor Point Retail",
        contactName: "Liam Ortega",
        email: "liam.ortega@harborpointretail.com",
        phone: "(213) 555-1944",
        tier: "Growth",
      },
    }),
    prisma.client.create({
      data: {
        companyName: "Pacific Commerce Carlson",
        contactName: "Ari Parker",
        email: "ari.parker@pccarson.com",
        phone: "(424) 555-1846",
        tier: "Growth",
      },
    }),
    prisma.client.create({
      data: {
        companyName: "Westlake Medical Plaza",
        contactName: "Rosa Patel",
        email: "rosa.patel@westlakemedicalplaza.com",
        phone: "(424) 555-4401",
        tier: "Standard",
      },
    }),
  ]);

  const [propertyA, propertyB, propertyC, propertyD, propertyE] = await Promise.all([
    prisma.property.create({
      data: {
        name: "Sunset Medical Offices",
        addressLine1: "1616 Sunset Blvd",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90026",
        managerName: "Naomi Lee",
        managerEmail: "naomi.lee@sunsetmedicalcenters.com",
        managerPhone: "(323) 555-1240",
        clientId: clientA.id,
      },
    }),
    prisma.property.create({
      data: {
        name: "ParkVista Apartments",
        addressLine1: "1032 W 8th St",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90017",
        managerName: "Alyssa Chen",
        managerEmail: "alyssa.chen@apexresidential.com",
        managerPhone: "(323) 555-1102",
        clientId: clientB.id,
      },
    }),
    prisma.property.create({
      data: {
        name: "Harbor Point Mall",
        addressLine1: "1717 S Alameda St",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90021",
        managerName: "Mason Dean",
        managerEmail: "mason.dean@harborpointretail.com",
        managerPhone: "(213) 555-7152",
        clientId: clientC.id,
      },
    }),
    prisma.property.create({
      data: {
        name: "Pacific Commerce Plaza",
        addressLine1: "2400 E Carson St",
        city: "Long Beach",
        state: "CA",
        zipCode: "90810",
        managerName: "Ari Parker",
        managerEmail: "ari.parker@pccarson.com",
        managerPhone: "(424) 555-1846",
        clientId: clientD.id,
      },
    }),
    prisma.property.create({
      data: {
        name: "Westlake Medical Plaza",
        addressLine1: "2540 Wilshire Blvd",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90057",
        managerName: "Rosa Patel",
        managerEmail: "rosa.patel@westlakemedicalplaza.com",
        managerPhone: "(424) 555-4401",
        clientId: clientE.id,
      },
    }),
  ]);

  const [employeeA, employeeB, employeeC, employeeD, employeeE, employeeF] = await Promise.all([
    prisma.employee.create({
      data: {
        fullName: "Mike Thompson",
        email: "mike.thompson@envisionmaintenence.com",
        phone: "(323) 555-2301",
        role: EmployeeRole.SUPERVISOR,
        status: EmployeeStatus.ACTIVE,
        territory: "Central LA",
        avatarUrl:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80",
      },
    }),
    prisma.employee.create({
      data: {
        fullName: "Maria Santos",
        email: "maria.santos@envisionmaintenence.com",
        phone: "(323) 555-2302",
        role: EmployeeRole.FIELD_TECH,
        status: EmployeeStatus.ACTIVE,
        territory: "West LA",
        avatarUrl:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
      },
    }),
    prisma.employee.create({
      data: {
        fullName: "Jaime Gonzalez",
        email: "jaime.gonzalez@envisionmaintenence.com",
        phone: "(323) 555-2303",
        role: EmployeeRole.FIELD_TECH,
        status: EmployeeStatus.ACTIVE,
        territory: "South Bay",
        avatarUrl:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
      },
    }),
    prisma.employee.create({
      data: {
        fullName: "Kevin Bryant",
        email: "kevin.bryant@envisionmaintenence.com",
        phone: "(323) 555-2304",
        role: EmployeeRole.FIELD_TECH,
        status: EmployeeStatus.ACTIVE,
        territory: "Downtown LA",
        avatarUrl:
          "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=300&q=80",
      },
    }),
    prisma.employee.create({
      data: {
        fullName: "Carlos Medina",
        email: "carlos.medina@envisionmaintenence.com",
        phone: "(323) 555-2305",
        role: EmployeeRole.COORDINATOR,
        status: EmployeeStatus.ACTIVE,
        territory: "San Fernando Valley",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
      },
    }),
    prisma.employee.create({
      data: {
        fullName: "Irene Brooks",
        email: "irene.brooks@envisionmaintenence.com",
        phone: "(323) 555-2306",
        role: EmployeeRole.DISPATCH,
        status: EmployeeStatus.ACTIVE,
        territory: "Regional Dispatch",
        avatarUrl:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
      },
    }),
  ]);

  await prisma.servicePackage.createMany({
    data: [
      {
        slug: "rapid-response",
        name: "Rapid Response Operations",
        summary:
          "Emergency dispatch, triage, and completion tracking for high-priority incidents.",
        responseSlaHours: 2,
        coverageArea: "Greater Los Angeles",
        startingPrice: "$1,250/mo",
        featured: true,
      },
      {
        slug: "property-turnovers",
        name: "Property Turnover Program",
        summary:
          "Move-out repairs, post-construction cleanup, and make-ready coordination.",
        responseSlaHours: 8,
        coverageArea: "LA Metro + South Bay",
        startingPrice: "$890/mo",
        featured: true,
      },
      {
        slug: "preventive-maintenance",
        name: "Preventive Maintenance",
        summary:
          "Scheduled inspections and recurring tasks to reduce emergency events.",
        responseSlaHours: 24,
        coverageArea: "Los Angeles County",
        startingPrice: "$1,450/mo",
        featured: false,
      },
      {
        slug: "confidential-projects",
        name: "Confidential Project Support",
        summary:
          "Discreet maintenance and renovation workflows for sensitive properties.",
        responseSlaHours: 6,
        coverageArea: "Los Angeles + Orange County",
        startingPrice: "$2,400/mo",
        featured: false,
      },
    ],
  });

  await prisma.galleryAsset.createMany({
    data: [
      {
        title: "Night Shift Cleanup",
        caption: "After-hours cleanup and turnover prep for retail tenants.",
        category: "Commercial Cleaning",
        imageUrl:
          "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80",
        featured: true,
        capturedAt: new Date("2026-01-05T09:00:00.000Z"),
        location: "Downtown Los Angeles",
      },
      {
        title: "Mechanical Room Audit",
        caption: "Preventive maintenance checklist review for critical systems.",
        category: "Preventive Maintenance",
        imageUrl:
          "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1400&q=80",
        featured: true,
        capturedAt: new Date("2026-01-16T09:00:00.000Z"),
        location: "Koreatown",
      },
      {
        title: "Lobby Renovation",
        caption: "Finish carpentry and paint closeout for Class A property.",
        category: "Remodeling",
        imageUrl:
          "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80",
        featured: false,
        capturedAt: new Date("2026-01-23T09:00:00.000Z"),
        location: "Century City",
      },
      {
        title: "Turnover Quality Check",
        caption: "Final walkthrough before resident handoff.",
        category: "Property Turnover",
        imageUrl:
          "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=1400&q=80",
        featured: false,
        capturedAt: new Date("2026-02-02T09:00:00.000Z"),
        location: "West Hollywood",
      },
    ],
  });

  const [leadA, leadB, leadC, leadD, leadE, leadF, leadG, leadH] = await Promise.all([
    prisma.lead.create({
      data: {
        name: "Emily Porter",
        email: "eporter@grandvistaassets.com",
        phone: "(310) 555-3341",
        company: "Grand Vista Assets",
        serviceNeeded: "Emergency Service Response",
        message: "Need 24/7 emergency support contract for 8 multifamily properties.",
        source: "website-contact",
        status: LeadStatus.NEW,
      },
    }),
    prisma.lead.create({
      data: {
        name: "Carlos Mendez",
        email: "cmendez@harborpointretail.com",
        phone: "(213) 555-7742",
        company: "Harbor Point Retail",
        serviceNeeded: "Post-Construction Cleanup",
        message: "Requesting proposal for phased cleanup over six retail suites.",
        source: "website-contact",
        status: LeadStatus.CONTACTED,
      },
    }),
    prisma.lead.create({
      data: {
        name: "Aline Rivera",
        email: "aline.rivera@sunsetmedicalcenters.com",
        phone: "(323) 555-2020",
        company: "Sunset Medical Centers",
        serviceNeeded: "Office Cleaning",
        message: "Need recurring evening cleaning for 3 office floors.",
        source: "referral",
        status: LeadStatus.QUALIFIED,
      },
    }),
    prisma.lead.create({
      data: {
        name: "Jerome Watts",
        email: "jerome.watts@westlakemedicalplaza.com",
        phone: "(424) 555-6033",
        company: "Westlake Medical Plaza",
        serviceNeeded: "General Maintenance",
        message: "Looking for bundled preventive and emergency package pricing.",
        source: "outbound",
        status: LeadStatus.WON,
      },
    }),
    prisma.lead.create({
      data: {
        name: "Renee Coleman",
        email: "rcoleman@downtownlofts.co",
        phone: "(213) 555-4431",
        company: "Downtown Lofts",
        serviceNeeded: "Property Turnover",
        message: "Need support for 14 unit turnovers by month end.",
        source: "website-contact",
        status: LeadStatus.NEW,
      },
    }),
    prisma.lead.create({
      data: {
        name: "Victor Kim",
        email: "vkim@pacificcommerceplaza.com",
        phone: "(424) 555-9910",
        company: "Pacific Commerce Plaza",
        serviceNeeded: "After Hours Maintenance",
        message: "Evaluating service partners for off-hours maintenance support.",
        source: "partner-referral",
        status: LeadStatus.CONTACTED,
      },
    }),
    prisma.lead.create({
      data: {
        name: "Helena Wu",
        email: "helena.wu@harborpointretail.com",
        phone: "(213) 555-1029",
        company: "Harbor Point Retail",
        serviceNeeded: "Renovation Support",
        message: "Need coordinated cleanup and patch-repair support after remodel.",
        source: "website-contact",
        status: LeadStatus.QUALIFIED,
      },
    }),
    prisma.lead.create({
      data: {
        name: "Marcus Gray",
        email: "mgray@citylineoffices.com",
        phone: "(323) 555-7700",
        company: "Cityline Offices",
        serviceNeeded: "Emergency Plumbing",
        message: "Urgent overnight response needed for repeated plumbing incidents.",
        source: "phone",
        status: LeadStatus.LOST,
      },
    }),
  ]);

  const [workOrderA, workOrderB, workOrderC, workOrderD, workOrderE, workOrderF] =
    await Promise.all([
      prisma.workOrder.create({
        data: {
          code: "WO-260201-93",
          title: "Office cleaning and sanitation",
          description: "Nightly office cleaning and surface sanitation service package.",
          status: WorkOrderStatus.IN_PROGRESS,
          priority: Priority.HIGH,
          assignee: employeeA.fullName,
          assignedEmployeeId: employeeA.id,
          estimatedHours: 32,
          actualHours: 16,
          estimatedValueCents: 1620000,
          locationLabel: "Sunset Medical Offices",
          scheduledFor: dateAtOffset(1, 9, 0),
          clientId: clientA.id,
          propertyId: propertyA.id,
        },
      }),
      prisma.workOrder.create({
        data: {
          code: "WO-260203-11",
          title: "Emergency plumbing repair",
          description: "Resolve line pressure issue and leak points across two units.",
          status: WorkOrderStatus.SCHEDULED,
          priority: Priority.URGENT,
          assignee: employeeB.fullName,
          assignedEmployeeId: employeeB.id,
          estimatedHours: 10,
          estimatedValueCents: 970000,
          locationLabel: "ParkVista Apartments",
          scheduledFor: dateAtOffset(1, 13, 0),
          clientId: clientB.id,
          propertyId: propertyB.id,
        },
      }),
      prisma.workOrder.create({
        data: {
          code: "WO-260210-34",
          title: "Post-construction cleanup",
          description: "Detail cleanup after tenant improvement project across 6 suites.",
          status: WorkOrderStatus.COMPLETED,
          priority: Priority.MEDIUM,
          assignee: employeeC.fullName,
          assignedEmployeeId: employeeC.id,
          estimatedHours: 24,
          actualHours: 22,
          estimatedValueCents: 2240000,
          locationLabel: "Harbor Point Mall",
          scheduledFor: dateAtOffset(-3, 8, 0),
          completedAt: dateAtOffset(-2, 18, 0),
          clientId: clientC.id,
          propertyId: propertyC.id,
        },
      }),
      prisma.workOrder.create({
        data: {
          code: "WO-260242-01",
          title: "Tenant turnover package",
          description: "Paint touch-ups, lock swap, and final QA for tenant handoff.",
          status: WorkOrderStatus.SCHEDULED,
          priority: Priority.MEDIUM,
          assignee: employeeD.fullName,
          assignedEmployeeId: employeeD.id,
          estimatedHours: 12,
          estimatedValueCents: 1180000,
          locationLabel: "Pacific Commerce Plaza",
          scheduledFor: dateAtOffset(3, 10, 0),
          clientId: clientD.id,
          propertyId: propertyD.id,
        },
      }),
      prisma.workOrder.create({
        data: {
          code: "WO-260251-77",
          title: "Preventive HVAC inspection",
          description: "Routine seasonal HVAC inspection and tune-up.",
          status: WorkOrderStatus.BACKLOG,
          priority: Priority.LOW,
          assignee: employeeE.fullName,
          assignedEmployeeId: employeeE.id,
          estimatedHours: 6,
          estimatedValueCents: 520000,
          locationLabel: "Westlake Medical Plaza",
          scheduledFor: dateAtOffset(5, 11, 30),
          clientId: clientE.id,
          propertyId: propertyE.id,
        },
      }),
      prisma.workOrder.create({
        data: {
          code: "WO-260255-18",
          title: "Electrical panel troubleshooting",
          description: "Investigate and resolve intermittent power failures in common areas.",
          status: WorkOrderStatus.ON_HOLD,
          priority: Priority.HIGH,
          assignee: employeeA.fullName,
          assignedEmployeeId: employeeA.id,
          estimatedHours: 9,
          estimatedValueCents: 760000,
          locationLabel: "Sunset Medical Offices",
          scheduledFor: dateAtOffset(2, 14, 0),
          clientId: clientA.id,
          propertyId: propertyA.id,
        },
      }),
    ]);

  const [estimateA, estimateB, estimateC, estimateD, estimateE] = await Promise.all([
    prisma.estimate.create({
      data: {
        estimateNumber: "EST-2602-001",
        title: "Quarterly janitorial services",
        description: "Comprehensive cleaning package for medical offices and common areas.",
        amountCents: 9825000,
        status: EstimateStatus.SENT,
        validUntil: dateAtOffset(14, 17, 0),
        preparedBy: adminUser.fullName,
        clientId: clientA.id,
        propertyId: propertyA.id,
        leadId: leadC.id,
      },
    }),
    prisma.estimate.create({
      data: {
        estimateNumber: "EST-2602-002",
        title: "Emergency plumbing response contract",
        description: "24/7 emergency response SLA for multifamily portfolio.",
        amountCents: 6450000,
        status: EstimateStatus.APPROVED,
        validUntil: dateAtOffset(10, 17, 0),
        preparedBy: managerUser.fullName,
        clientId: clientB.id,
        propertyId: propertyB.id,
        leadId: leadA.id,
        convertedWorkOrderId: workOrderB.id,
      },
    }),
    prisma.estimate.create({
      data: {
        estimateNumber: "EST-2602-003",
        title: "Retail suite closeout support",
        description: "Post-renovation cleanup and punch-list support for six suites.",
        amountCents: 3920000,
        status: EstimateStatus.CONVERTED,
        validUntil: dateAtOffset(7, 17, 0),
        preparedBy: adminUser.fullName,
        clientId: clientC.id,
        propertyId: propertyC.id,
        leadId: leadB.id,
        convertedWorkOrderId: workOrderC.id,
      },
    }),
    prisma.estimate.create({
      data: {
        estimateNumber: "EST-2602-004",
        title: "Turnover sprint package",
        description: "Unit turnover and quality assurance for multifamily transition period.",
        amountCents: 5570000,
        status: EstimateStatus.DRAFT,
        validUntil: dateAtOffset(21, 17, 0),
        preparedBy: managerUser.fullName,
        clientId: clientD.id,
        propertyId: propertyD.id,
        leadId: leadE.id,
      },
    }),
    prisma.estimate.create({
      data: {
        estimateNumber: "EST-2602-005",
        title: "Preventive maintenance annual plan",
        description: "Planned preventive cycles for HVAC, plumbing, and electrical assets.",
        amountCents: 7140000,
        status: EstimateStatus.REJECTED,
        validUntil: dateAtOffset(-1, 17, 0),
        preparedBy: adminUser.fullName,
        clientId: clientE.id,
        propertyId: propertyE.id,
        leadId: leadF.id,
        notes: "Client deferred budget to next quarter.",
      },
    }),
  ]);

  await Promise.all([
    prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2602-001",
        amountCents: 4850000,
        status: InvoiceStatus.SENT,
        issuedAt: dateAtOffset(-5, 8, 0),
        dueDate: dateAtOffset(10, 17, 0),
        clientId: clientA.id,
        workOrderId: workOrderA.id,
        notes: "Net 15 terms",
      },
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2602-002",
        amountCents: 7350000,
        status: InvoiceStatus.OVERDUE,
        issuedAt: dateAtOffset(-28, 8, 0),
        dueDate: dateAtOffset(-8, 17, 0),
        clientId: clientB.id,
        workOrderId: workOrderB.id,
        notes: "Follow-up required by account management.",
      },
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2602-003",
        amountCents: 3120000,
        status: InvoiceStatus.PAID,
        issuedAt: dateAtOffset(-22, 8, 0),
        dueDate: dateAtOffset(-5, 17, 0),
        paidAt: dateAtOffset(-6, 12, 0),
        clientId: clientC.id,
        workOrderId: workOrderC.id,
      },
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2602-004",
        amountCents: 2680000,
        status: InvoiceStatus.PARTIAL,
        issuedAt: dateAtOffset(-14, 8, 0),
        dueDate: dateAtOffset(2, 17, 0),
        clientId: clientD.id,
        workOrderId: workOrderD.id,
      },
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2602-005",
        amountCents: 2190000,
        status: InvoiceStatus.DRAFT,
        issuedAt: dateAtOffset(-2, 8, 0),
        dueDate: dateAtOffset(20, 17, 0),
        clientId: clientE.id,
        workOrderId: workOrderE.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.scheduleItem.create({
      data: {
        title: "Office Cleaning",
        serviceType: "Recurring Cleaning",
        startAt: dateAtOffset(0, 9, 0),
        endAt: dateAtOffset(0, 13, 0),
        status: ScheduleStatus.DISPATCHED,
        location: "Sunset Medical Plaza",
        employeeId: employeeA.id,
        workOrderId: workOrderA.id,
        clientId: clientA.id,
        propertyId: propertyA.id,
      },
    }),
    prisma.scheduleItem.create({
      data: {
        title: "Emergency Service",
        serviceType: "Emergency Plumbing",
        startAt: dateAtOffset(0, 10, 0),
        endAt: dateAtOffset(0, 14, 0),
        status: ScheduleStatus.SCHEDULED,
        location: "ParkVista Apartments",
        employeeId: employeeB.id,
        workOrderId: workOrderB.id,
        clientId: clientB.id,
        propertyId: propertyB.id,
      },
    }),
    prisma.scheduleItem.create({
      data: {
        title: "Post Construction Cleanup",
        serviceType: "Closeout Cleanup",
        startAt: dateAtOffset(0, 9, 0),
        endAt: dateAtOffset(0, 14, 0),
        status: ScheduleStatus.IN_PROGRESS,
        location: "Apex Residences",
        employeeId: employeeC.id,
        workOrderId: workOrderC.id,
        clientId: clientC.id,
        propertyId: propertyC.id,
      },
    }),
    prisma.scheduleItem.create({
      data: {
        title: "General Maintenance",
        serviceType: "Routine Maintenance",
        startAt: dateAtOffset(0, 14, 0),
        endAt: dateAtOffset(0, 23, 0),
        status: ScheduleStatus.SCHEDULED,
        location: "Local Real Medical",
        employeeId: employeeD.id,
        workOrderId: workOrderD.id,
        clientId: clientD.id,
        propertyId: propertyD.id,
      },
    }),
    prisma.scheduleItem.create({
      data: {
        title: "Property Turnover",
        serviceType: "Turnover",
        startAt: dateAtOffset(0, 10, 0),
        endAt: dateAtOffset(0, 16, 0),
        status: ScheduleStatus.SCHEDULED,
        location: "Prospectly Condos: Parc",
        employeeId: employeeE.id,
        workOrderId: workOrderE.id,
        clientId: clientE.id,
        propertyId: propertyE.id,
      },
    }),
    prisma.scheduleItem.create({
      data: {
        title: "Electrical Diagnostics",
        serviceType: "Electrical Maintenance",
        startAt: dateAtOffset(1, 15, 0),
        endAt: dateAtOffset(1, 18, 0),
        status: ScheduleStatus.SCHEDULED,
        location: "Sunset Medical Offices",
        employeeId: employeeA.id,
        workOrderId: workOrderF.id,
        clientId: clientA.id,
        propertyId: propertyA.id,
      },
    }),
    prisma.scheduleItem.create({
      data: {
        title: "Dispatch QA Review",
        serviceType: "Operations Oversight",
        startAt: dateAtOffset(0, 16, 0),
        endAt: dateAtOffset(0, 18, 0),
        status: ScheduleStatus.SCHEDULED,
        location: "Regional Dispatch Center",
        employeeId: employeeF.id,
        clientId: clientA.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.activityLog.create({
      data: {
        actorName: "Naomi Lee",
        action: "Converted lead",
        entityType: "Lead",
        entityId: leadC.id,
        description: "Converted qualified lead into estimate EST-2602-001 ($98,250).",
        severity: ActivitySeverity.SUCCESS,
        userId: adminUser.id,
        clientId: clientA.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        actorName: "Carlos Mendez",
        action: "Assigned technician",
        entityType: "WorkOrder",
        entityId: workOrderB.id,
        description: "Assigned Maria Santos to emergency plumbing work order WO-260203-11.",
        severity: ActivitySeverity.INFO,
        userId: managerUser.id,
        clientId: clientB.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        actorName: "Irene Brooks",
        action: "Rescheduled dispatch",
        entityType: "Schedule",
        entityId: workOrderD.id,
        description: "Shifted dispatch window to align with tenant access constraints.",
        severity: ActivitySeverity.WARNING,
        userId: managerUser.id,
        clientId: clientD.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        actorName: "Naomi Lee",
        action: "Invoice overdue",
        entityType: "Invoice",
        entityId: "INV-2602-002",
        description: "Invoice INV-2602-002 is 8 days overdue and escalated for follow-up.",
        severity: ActivitySeverity.URGENT,
        userId: adminUser.id,
        clientId: clientB.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        actorName: "Jaime Gonzalez",
        action: "Work completed",
        entityType: "WorkOrder",
        entityId: workOrderC.id,
        description: "Completed post-construction cleanup for Harbor Point Mall.",
        severity: ActivitySeverity.SUCCESS,
        userId: managerUser.id,
        clientId: clientC.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        actorName: "Carlos Medina",
        action: "Created estimate",
        entityType: "Estimate",
        entityId: estimateD.id,
        description: "Drafted EST-2602-004 turnover sprint package for review.",
        severity: ActivitySeverity.INFO,
        userId: managerUser.id,
        clientId: clientD.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        actorName: "Naomi Lee",
        action: "Lead qualified",
        entityType: "Lead",
        entityId: leadG.id,
        description: "Promoted Harbor Point lead to qualified after site walkthrough.",
        severity: ActivitySeverity.INFO,
        userId: adminUser.id,
        clientId: clientC.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        actorName: "Naomi Lee",
        action: "Approved estimate",
        entityType: "Estimate",
        entityId: estimateB.id,
        description: "Client approved EST-2602-002 and conversion to active work order is complete.",
        severity: ActivitySeverity.SUCCESS,
        userId: adminUser.id,
        clientId: clientB.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        actorName: "Carlos Mendez",
        action: "Lead marked won",
        entityType: "Lead",
        entityId: leadD.id,
        description: "Closed Westlake Medical Plaza lead as won and initiated onboarding.",
        severity: ActivitySeverity.SUCCESS,
        userId: managerUser.id,
        clientId: clientE.id,
      },
    }),
    prisma.activityLog.create({
      data: {
        actorName: "Irene Brooks",
        action: "Lead closed lost",
        entityType: "Lead",
        entityId: leadH.id,
        description: "Closed lead after customer selected a lower-cost vendor.",
        severity: ActivitySeverity.WARNING,
        userId: managerUser.id,
        clientId: clientA.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.user.update({
      where: { id: adminUser.id },
      data: { clientId: clientA.id },
    }),
    prisma.user.update({
      where: { id: managerUser.id },
      data: { clientId: clientB.id },
    }),
  ]);

  await Promise.all([
    prisma.estimate.update({
      where: { id: estimateA.id },
      data: { notes: "Proposal includes weekend support add-on." },
    }),
    prisma.estimate.update({
      where: { id: estimateC.id },
      data: { notes: "Converted into WO-260210-34." },
    }),
    prisma.estimate.update({
      where: { id: estimateE.id },
      data: { notes: "Budget freeze for current quarter." },
    }),
  ]);

  const [processorStripe, processorSquare] = await Promise.all([
    prisma.paymentProcessor.create({
      data: {
        name: "Stripe",
        enabled: true,
        sandboxMode: true,
        publishableKeyMasked: "pk_test_****************",
        webhookUrl: "https://api.envisionmaintenence.com/webhooks/stripe",
        notes: "Primary card processor for portal invoicing.",
      },
    }),
    prisma.paymentProcessor.create({
      data: {
        name: "Square",
        enabled: false,
        sandboxMode: true,
        publishableKeyMasked: "sq0idp-****************",
        webhookUrl: "https://api.envisionmaintenence.com/webhooks/square",
      },
    }),
  ]);

  const invoices = await prisma.invoice.findMany({
    orderBy: [{ createdAt: "asc" }],
  });
  const invoice1 = invoices[0];
  const invoice2 = invoices[1];
  const invoice3 = invoices[2];

  if (invoice1 && invoice2 && invoice3) {
    await Promise.all([
      prisma.paymentRecord.create({
        data: {
          invoiceId: invoice1.id,
          amountCents: 2425000,
          processor: processorStripe.name,
          externalReference: "ch_3N8xN*****",
          status: PaymentStatus.SETTLED,
          paidAt: dateAtOffset(-2, 11, 10),
          notes: "Partial settlement for current cycle.",
        },
      }),
      prisma.paymentRecord.create({
        data: {
          invoiceId: invoice2.id,
          amountCents: 1200000,
          processor: processorStripe.name,
          externalReference: "ch_3N9wE*****",
          status: PaymentStatus.SETTLED,
          paidAt: dateAtOffset(-1, 10, 5),
          notes: "First payment toward overdue balance.",
        },
      }),
      prisma.paymentRecord.create({
        data: {
          invoiceId: invoice3.id,
          amountCents: invoice3.amountCents,
          processor: processorSquare.name,
          externalReference: "sq_txn_2*****",
          status: PaymentStatus.SETTLED,
          paidAt: dateAtOffset(-6, 12, 0),
        },
      }),
    ]);
  }

  await Promise.all([
    prisma.onboardingTask.create({
      data: {
        title: "Import previous customer ledger",
        owner: "Naomi Lee",
        status: OnboardingStatus.IN_PROGRESS,
        dueDate: dateAtOffset(2, 17, 0),
        notes: "Migrate contacts and open invoice balances.",
        clientId: clientA.id,
      },
    }),
    prisma.onboardingTask.create({
      data: {
        title: "Configure dispatch zones",
        owner: "Irene Brooks",
        status: OnboardingStatus.PENDING,
        dueDate: dateAtOffset(4, 17, 0),
        clientId: clientB.id,
      },
    }),
    prisma.onboardingTask.create({
      data: {
        title: "Run kickoff walkthrough",
        owner: "Carlos Mendez",
        status: OnboardingStatus.COMPLETED,
        dueDate: dateAtOffset(-2, 15, 0),
        completedAt: dateAtOffset(-2, 18, 0),
        clientId: clientC.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.contactPerson.create({
      data: {
        fullName: "Naomi Lee",
        email: "naomi.lee@sunsetmedicalcenters.com",
        phone: "(323) 555-1240",
        title: "Portfolio Director",
        status: ContactStatus.ACTIVE,
        isPrimary: true,
        isBilling: false,
        clientId: clientA.id,
      },
    }),
    prisma.contactPerson.create({
      data: {
        fullName: "Rachel Dunn",
        email: "billing@sunsetmedicalcenters.com",
        phone: "(323) 555-7331",
        title: "AP Supervisor",
        status: ContactStatus.ACTIVE,
        isPrimary: false,
        isBilling: true,
        clientId: clientA.id,
      },
    }),
    prisma.contactPerson.create({
      data: {
        fullName: "Maya Franklin",
        email: "maya.franklin@apexresidential.com",
        phone: "(323) 555-1020",
        title: "Regional Manager",
        status: ContactStatus.ACTIVE,
        isPrimary: true,
        clientId: clientB.id,
      },
    }),
  ]);

  const bookingA = await prisma.bookingRequest.create({
    data: {
      name: "Elijah Knox",
      email: "elijah.knox@citylineoffices.com",
      phone: "(310) 555-4502",
      company: "Cityline Offices",
      address: "221 S Olive St, Los Angeles, CA",
      serviceType: "Commercial Cleaning",
      frequency: "Weekly",
      preferredDate: dateAtOffset(3, 8, 30),
      source: "website-booking",
      status: BookingStatus.REVIEWED,
      notes: "Requesting evening shifts only.",
      convertedLeadId: leadA.id,
    },
  });

  await prisma.bookingRequest.create({
    data: {
      name: "Nora Hall",
      email: "nhall@loftdistrict.co",
      phone: "(213) 555-6112",
      company: "Loft District",
      serviceType: "Property Turnover",
      frequency: "One-Time",
      preferredDate: dateAtOffset(1, 10, 0),
      source: "website-booking",
      status: BookingStatus.NEW,
      notes: "Urgent move-out prep for 6 units.",
    },
  });

  await Promise.all([
    prisma.fieldCheckIn.create({
      data: {
        type: CheckInType.CLOCK_IN,
        employeeId: employeeA.id,
        scheduleItemId: (await prisma.scheduleItem.findFirst({ orderBy: { createdAt: "asc" } }))?.id ?? null,
        latitude: 34.0469,
        longitude: -118.2517,
        notes: "Clocked in from property lot.",
      },
    }),
    prisma.fieldCheckIn.create({
      data: {
        type: CheckInType.ON_MY_WAY,
        employeeId: employeeB.id,
        latitude: 34.0601,
        longitude: -118.2387,
        notes: "ETA 12 minutes",
      },
    }),
    prisma.fieldCheckIn.create({
      data: {
        type: CheckInType.COMPLETE,
        employeeId: employeeC.id,
        latitude: 34.0241,
        longitude: -118.2865,
      },
    }),
  ]);

  await Promise.all([
    prisma.automationRule.create({
      data: {
        name: "Booking Confirmation",
        channel: ChannelType.EMAIL,
        triggerEvent: "booking.created",
        sendAfterMinutes: 2,
        templateSubject: "Booking received by Envision Maintenence",
        templateBody:
          "Thank you for your request. Our operations team is reviewing your booking and will confirm service timing shortly.",
        status: CampaignStatus.ACTIVE,
      },
    }),
    prisma.automationRule.create({
      data: {
        name: "Invoice Due Reminder",
        channel: ChannelType.SMS,
        triggerEvent: "invoice.due_48h",
        sendAfterMinutes: 0,
        templateBody: "Friendly reminder: your invoice is due in 48 hours. Reply HELP for assistance.",
        status: CampaignStatus.ACTIVE,
        clientId: clientB.id,
      },
    }),
  ]);

  const rules = await prisma.automationRule.findMany({
    orderBy: [{ createdAt: "asc" }],
  });
  const ruleA = rules[0];
  const ruleB = rules[1];

  await Promise.all([
    prisma.messageLog.create({
      data: {
        recipient: bookingA.email,
        channel: ChannelType.EMAIL,
        subject: "Booking confirmation",
        body: "We received your booking and opened intake record BK-001.",
        status: MessageStatus.SENT,
        sentAt: dateAtOffset(0, 9, 2),
        campaignId: ruleA?.id ?? null,
      },
    }),
    prisma.messageLog.create({
      data: {
        recipient: clientB.phone,
        channel: ChannelType.SMS,
        body: "Invoice reminder: payment due within 48 hours.",
        status: MessageStatus.QUEUED,
        scheduledFor: dateAtOffset(1, 8, 0),
        campaignId: ruleB?.id ?? null,
        clientId: clientB.id,
      },
    }),
  ]);

  const payrollRun = await prisma.payrollRun.create({
    data: {
      periodStart: dateAtOffset(-13, 0, 0),
      periodEnd: dateAtOffset(0, 0, 0),
      status: PayrollStatus.APPROVED,
      totalGrossCents: 0,
      notes: "Bi-weekly payroll for field team.",
    },
  });

  await Promise.all([
    prisma.payrollEntry.create({
      data: {
        payrollRunId: payrollRun.id,
        employeeId: employeeA.id,
        hoursWorked: 80,
        baseRateCents: 4800,
        bonusCents: 40000,
        grossCents: 424000,
      },
    }),
    prisma.payrollEntry.create({
      data: {
        payrollRunId: payrollRun.id,
        employeeId: employeeB.id,
        hoursWorked: 76,
        baseRateCents: 4200,
        bonusCents: 25000,
        grossCents: 344200,
      },
    }),
  ]);

  await prisma.payrollRun.update({
    where: { id: payrollRun.id },
    data: {
      totalGrossCents: 768200,
    },
  });

  await Promise.all([
    prisma.availabilityBlock.create({
      data: {
        employeeId: employeeC.id,
        startAt: dateAtOffset(2, 8, 0),
        endAt: dateAtOffset(2, 17, 0),
        type: AvailabilityType.TIME_OFF,
        reason: "Personal leave",
        approved: true,
      },
    }),
    prisma.availabilityBlock.create({
      data: {
        employeeId: employeeD.id,
        startAt: dateAtOffset(1, 13, 0),
        endAt: dateAtOffset(1, 18, 0),
        type: AvailabilityType.BLOCKED,
        reason: "Training session",
        approved: true,
      },
    }),
  ]);

  await Promise.all([
    prisma.integrationConnection.create({
      data: {
        provider: "zapier",
        status: IntegrationStatus.CONNECTED,
        apiKeyMasked: "zap_****************",
        webhookUrl: "https://hooks.zapier.com/hooks/catch/******",
        syncIntervalMinutes: 15,
        lastSyncAt: dateAtOffset(0, 6, 30),
        notes: "Connected for marketing and accounting automations.",
      },
    }),
    prisma.integrationConnection.create({
      data: {
        provider: "quickbooks",
        status: IntegrationStatus.PENDING,
        syncIntervalMinutes: 60,
        notes: "Planned for next billing phase rollout.",
      },
    }),
  ]);

  await Promise.all([
    prisma.planTier.create({
      data: {
        code: "STARTER",
        name: "Starter",
        monthlyPriceCents: 9900,
        maxUsers: 5,
        maxClients: 50,
        maxProperties: 80,
        apiAccess: false,
        mobileAccess: true,
        automationAccess: false,
      },
    }),
    prisma.planTier.create({
      data: {
        code: "PRO",
        name: "Pro",
        monthlyPriceCents: 24900,
        maxUsers: 20,
        maxClients: 300,
        maxProperties: 500,
        apiAccess: true,
        mobileAccess: true,
        automationAccess: true,
      },
    }),
    prisma.planTier.create({
      data: {
        code: "ENTERPRISE",
        name: "Enterprise",
        monthlyPriceCents: 59900,
        maxUsers: 100,
        maxClients: 2500,
        maxProperties: 8000,
        apiAccess: true,
        mobileAccess: true,
        automationAccess: true,
      },
    }),
  ]);

  await Promise.all([
    prisma.exportJob.create({
      data: {
        resource: "invoices",
        format: "csv",
        status: ExportStatus.COMPLETED,
        requestedBy: adminUser.username,
        completedAt: dateAtOffset(0, 7, 0),
        notes: "Nightly accounting export.",
      },
    }),
    prisma.exportJob.create({
      data: {
        resource: "work-orders",
        format: "csv",
        status: ExportStatus.QUEUED,
        requestedBy: managerUser.username,
        notes: "Scheduled operations report export.",
      },
    }),
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
