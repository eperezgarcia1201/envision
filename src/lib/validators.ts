import { z } from "zod";

const leadStatusSchema = z.enum(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]);
const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const workOrderStatusSchema = z.enum([
  "BACKLOG",
  "SCHEDULED",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELED",
]);
const invoiceStatusSchema = z.enum(["DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE", "VOID"]);
const estimateStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "CONVERTED",
]);
const employeeRoleSchema = z.enum([
  "FIELD_TECH",
  "SUPERVISOR",
  "ACCOUNT_MANAGER",
  "DISPATCH",
  "COORDINATOR",
]);
const employeeStatusSchema = z.enum(["ACTIVE", "ON_LEAVE", "INACTIVE"]);
const scheduleStatusSchema = z.enum([
  "SCHEDULED",
  "DISPATCHED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELED",
]);

export const loginInputSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(6).max(256),
});

export const listQuerySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).optional(),
});

export const leadInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(25).optional().nullable(),
  company: z.string().trim().max(120).optional().nullable(),
  serviceNeeded: z.string().trim().max(120).optional().nullable(),
  message: z.string().trim().min(10).max(3000),
  source: z.string().trim().max(60).default("website"),
  status: leadStatusSchema.default("NEW"),
});

export const leadUpdateSchema = leadInputSchema.partial();

export const clientInputSchema = z.object({
  companyName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(25),
  tier: z.string().trim().min(2).max(40),
});

export const clientUpdateSchema = clientInputSchema.partial();

export const propertyInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  addressLine1: z.string().trim().min(4).max(200),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(40),
  zipCode: z.string().trim().min(3).max(20),
  managerName: z.string().trim().min(2).max(120),
  managerEmail: z.string().trim().email(),
  managerPhone: z.string().trim().min(7).max(25),
  clientId: z.string().trim().min(3).max(40).optional().nullable(),
});

export const propertyUpdateSchema = propertyInputSchema.partial();

export const workOrderInputSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(4000),
  priority: prioritySchema.default("MEDIUM"),
  status: workOrderStatusSchema.default("BACKLOG"),
  assignee: z.string().trim().max(120).optional().nullable(),
  assignedEmployeeId: z.string().trim().min(3).max(40).optional().nullable(),
  estimatedHours: z.coerce.number().int().min(1).max(240).optional().nullable(),
  actualHours: z.coerce.number().int().min(0).max(240).optional().nullable(),
  estimatedValueCents: z.coerce.number().int().min(0).max(500000000).optional().nullable(),
  locationLabel: z.string().trim().max(160).optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  clientId: z.string().trim().min(3).max(40).optional().nullable(),
  propertyId: z.string().trim().min(3).max(40).optional().nullable(),
});

export const workOrderUpdateSchema = workOrderInputSchema.partial();

export const invoiceInputSchema = z.object({
  invoiceNumber: z.string().trim().min(3).max(40).optional(),
  amountCents: z.coerce.number().int().min(1).max(500000000),
  status: invoiceStatusSchema.default("DRAFT"),
  issuedAt: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime(),
  paidAt: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  clientId: z.string().trim().min(3).max(40),
  workOrderId: z.string().trim().min(3).max(40).optional().nullable(),
});

export const invoiceUpdateSchema = invoiceInputSchema.partial();

export const estimateInputSchema = z.object({
  estimateNumber: z.string().trim().min(3).max(40).optional(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(4000),
  amountCents: z.coerce.number().int().min(1).max(500000000),
  status: estimateStatusSchema.default("DRAFT"),
  validUntil: z.string().datetime().optional().nullable(),
  preparedBy: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  clientId: z.string().trim().min(3).max(40).optional().nullable(),
  propertyId: z.string().trim().min(3).max(40).optional().nullable(),
  leadId: z.string().trim().min(3).max(40).optional().nullable(),
  convertedWorkOrderId: z.string().trim().min(3).max(40).optional().nullable(),
});

export const estimateUpdateSchema = estimateInputSchema.partial();

export const employeeInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(25),
  role: employeeRoleSchema,
  status: employeeStatusSchema.default("ACTIVE"),
  territory: z.string().trim().max(120).optional().nullable(),
  avatarUrl: z.string().trim().url().optional().nullable(),
});

export const employeeUpdateSchema = employeeInputSchema.partial();

export const scheduleItemInputSchema = z.object({
  title: z.string().trim().min(2).max(160),
  serviceType: z.string().trim().min(2).max(120),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  status: scheduleStatusSchema.default("SCHEDULED"),
  location: z.string().trim().min(2).max(200),
  notes: z.string().trim().max(2000).optional().nullable(),
  employeeId: z.string().trim().min(3).max(40).optional().nullable(),
  workOrderId: z.string().trim().min(3).max(40).optional().nullable(),
  clientId: z.string().trim().min(3).max(40).optional().nullable(),
  propertyId: z.string().trim().min(3).max(40).optional().nullable(),
});

export const scheduleItemUpdateSchema = scheduleItemInputSchema.partial();

export const idParamSchema = z.object({
  id: z.string().trim().min(3).max(64),
});
