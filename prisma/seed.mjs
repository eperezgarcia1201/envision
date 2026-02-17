import { hash } from "bcryptjs";
import {
  InvoiceStatus,
  LeadStatus,
  PrismaClient,
  Priority,
  UserRole,
  WorkOrderStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.property.deleteMany();
  await prisma.client.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.galleryAsset.deleteMany();
  await prisma.servicePackage.deleteMany();

  const adminPassword = process.env.ADMIN_PASSWORD ?? "1234qwer";
  const adminPasswordHash = await hash(adminPassword, 12);

  await prisma.user.create({
    data: {
      username: "admin",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      fullName: "Platform Administrator",
    },
  });

  const [clientA, clientB, clientC] = await Promise.all([
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
        companyName: "Pacific Commerce Centers",
        contactName: "Liam Ortega",
        email: "liam.ortega@pacificcommerce.co",
        phone: "(213) 555-1944",
        tier: "Growth",
      },
    }),
    prisma.client.create({
      data: {
        companyName: "Sunset Medical Offices",
        contactName: "Nora Webb",
        email: "nora.webb@sunsetmedicaloffice.com",
        phone: "(424) 555-7710",
        tier: "Standard",
      },
    }),
  ]);

  const [propertyA, propertyB, propertyC] = await Promise.all([
    prisma.property.create({
      data: {
        name: "Park Vista Apartments",
        addressLine1: "1032 W 8th St",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90017",
        managerName: "Alyssa Chen",
        managerEmail: "alyssa.chen@apexresidential.com",
        managerPhone: "(323) 555-1102",
        clientId: clientA.id,
      },
    }),
    prisma.property.create({
      data: {
        name: "Harbor Point Retail",
        addressLine1: "1717 S Alameda St",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90021",
        managerName: "Mason Dean",
        managerEmail: "mason.dean@pacificcommerce.co",
        managerPhone: "(213) 555-7152",
        clientId: clientB.id,
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
        managerEmail: "rosa.patel@sunsetmedicaloffice.com",
        managerPhone: "(424) 555-4401",
        clientId: clientC.id,
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

  await prisma.lead.createMany({
    data: [
      {
        name: "Emily Porter",
        email: "eporter@grandvistaassets.com",
        phone: "(310) 555-3341",
        company: "Grand Vista Assets",
        serviceNeeded: "Emergency Service Response",
        message: "Need 24/7 emergency support contract for 8 multifamily properties.",
        source: "website-contact",
        status: LeadStatus.NEW,
      },
      {
        name: "Carlos Mendez",
        email: "cmendez@harborpointretail.com",
        phone: "(213) 555-7742",
        company: "Harbor Point Retail",
        serviceNeeded: "Post-Construction Cleanup",
        message: "Requesting proposal for phased cleanup over six retail suites.",
        source: "website-contact",
        status: LeadStatus.CONTACTED,
      },
      {
        name: "Naomi Lee",
        email: "naomi.lee@orchidmgmt.com",
        phone: "(323) 555-9003",
        company: "Orchid Management",
        serviceNeeded: "Property Turnover",
        message: "Need turnover + punch list team for upcoming tenant transitions.",
        source: "partner-referral",
        status: LeadStatus.QUALIFIED,
      },
    ],
  });

  const workOrderA = await prisma.workOrder.create({
    data: {
      code: "WO-260201-71",
      title: "HVAC corrective maintenance",
      description: "Resolve cooling inconsistency on floors 2 and 3.",
      status: WorkOrderStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      assignee: "Field Team Alpha",
      estimatedHours: 8,
      actualHours: 5,
      scheduledFor: new Date("2026-02-18T16:00:00.000Z"),
      clientId: clientB.id,
      propertyId: propertyB.id,
    },
  });

  const workOrderB = await prisma.workOrder.create({
    data: {
      code: "WO-260203-11",
      title: "Unit turnover package",
      description: "Paint touch-ups, cleaning, lock hardware swap, and final QA.",
      status: WorkOrderStatus.SCHEDULED,
      priority: Priority.MEDIUM,
      assignee: "Turnover Crew 2",
      estimatedHours: 12,
      scheduledFor: new Date("2026-02-19T16:00:00.000Z"),
      clientId: clientA.id,
      propertyId: propertyA.id,
    },
  });

  const workOrderC = await prisma.workOrder.create({
    data: {
      code: "WO-260210-93",
      title: "Lobby flooring patch",
      description: "Repair and blend high-traffic tile sections at main entrance.",
      status: WorkOrderStatus.BACKLOG,
      priority: Priority.LOW,
      assignee: "Renovation Team 1",
      estimatedHours: 6,
      clientId: clientC.id,
      propertyId: propertyC.id,
    },
  });

  await Promise.all([
    prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2602-001",
        amountCents: 485000,
        status: InvoiceStatus.SENT,
        dueDate: new Date("2026-02-22T00:00:00.000Z"),
        clientId: clientA.id,
        workOrderId: workOrderB.id,
      },
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2602-002",
        amountCents: 735000,
        status: InvoiceStatus.PARTIAL,
        dueDate: new Date("2026-02-15T00:00:00.000Z"),
        clientId: clientB.id,
        workOrderId: workOrderA.id,
      },
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: "INV-2601-119",
        amountCents: 312000,
        status: InvoiceStatus.PAID,
        dueDate: new Date("2026-01-30T00:00:00.000Z"),
        paidAt: new Date("2026-01-27T00:00:00.000Z"),
        clientId: clientC.id,
        workOrderId: workOrderC.id,
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
