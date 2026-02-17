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
const userRoleSchema = z.enum(["ADMIN", "MANAGER", "CLIENT"]);
const onboardingStatusSchema = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"]);
const contactStatusSchema = z.enum(["ACTIVE", "INACTIVE", "DO_NOT_CONTACT"]);
const bookingStatusSchema = z.enum(["NEW", "REVIEWED", "QUOTED", "WON", "CLOSED"]);
const checkInTypeSchema = z.enum(["CLOCK_IN", "CLOCK_OUT", "ON_MY_WAY", "ARRIVED", "COMPLETE"]);
const channelTypeSchema = z.enum(["EMAIL", "SMS"]);
const campaignStatusSchema = z.enum(["ACTIVE", "PAUSED", "DISABLED"]);
const messageStatusSchema = z.enum(["QUEUED", "SENT", "FAILED", "CANCELED"]);
const paymentStatusSchema = z.enum(["PENDING", "SETTLED", "FAILED", "REFUNDED", "VOID"]);
const payrollStatusSchema = z.enum(["DRAFT", "APPROVED", "PROCESSED", "CANCELED"]);
const availabilityTypeSchema = z.enum(["AVAILABLE", "BLOCKED", "TIME_OFF", "PTO"]);
const integrationStatusSchema = z.enum(["CONNECTED", "DISCONNECTED", "ERROR", "PENDING"]);
const exportStatusSchema = z.enum(["QUEUED", "COMPLETED", "FAILED"]);

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

export const userAccountInputSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(6).max(256),
  role: userRoleSchema.default("CLIENT"),
  fullName: z.string().trim().max(120).optional().nullable(),
  clientId: z.string().trim().min(3).max(40).optional().nullable(),
});

export const userAccountUpdateSchema = z.object({
  username: z.string().trim().min(3).max(64).optional(),
  password: z.string().min(6).max(256).optional(),
  role: userRoleSchema.optional(),
  fullName: z.string().trim().max(120).optional().nullable(),
  clientId: z.string().trim().min(3).max(40).optional().nullable(),
});

export const servicePackageInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(8).max(800),
  responseSlaHours: z.coerce.number().int().min(1).max(168),
  coverageArea: z.string().trim().min(2).max(160),
  startingPrice: z.string().trim().min(2).max(80),
  featured: z.coerce.boolean().default(false),
});

export const servicePackageUpdateSchema = servicePackageInputSchema.partial();

export const onboardingTaskInputSchema = z.object({
  title: z.string().trim().min(3).max(160),
  owner: z.string().trim().max(120).optional().nullable(),
  status: onboardingStatusSchema.default("PENDING"),
  dueDate: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  clientId: z.string().trim().min(3).max(40).optional().nullable(),
});

export const onboardingTaskUpdateSchema = onboardingTaskInputSchema.partial();

export const contactPersonInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(25).optional().nullable(),
  title: z.string().trim().max(120).optional().nullable(),
  status: contactStatusSchema.default("ACTIVE"),
  isPrimary: z.coerce.boolean().default(false),
  isBilling: z.coerce.boolean().default(false),
  notes: z.string().trim().max(2000).optional().nullable(),
  clientId: z.string().trim().min(3).max(40),
});

export const contactPersonUpdateSchema = contactPersonInputSchema.partial();

export const bookingRequestInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(25).optional().nullable(),
  company: z.string().trim().max(160).optional().nullable(),
  address: z.string().trim().max(240).optional().nullable(),
  serviceType: z.string().trim().min(2).max(160),
  frequency: z.string().trim().max(80).optional().nullable(),
  preferredDate: z.string().datetime().optional().nullable(),
  source: z.string().trim().max(60).default("website-booking"),
  status: bookingStatusSchema.default("NEW"),
  notes: z.string().trim().max(2000).optional().nullable(),
  convertedLeadId: z.string().trim().min(3).max(40).optional().nullable(),
  clientId: z.string().trim().min(3).max(40).optional().nullable(),
});

export const bookingRequestUpdateSchema = bookingRequestInputSchema.partial();

export const fieldCheckInInputSchema = z.object({
  type: checkInTypeSchema,
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  employeeId: z.string().trim().min(3).max(40),
  scheduleItemId: z.string().trim().min(3).max(40).optional().nullable(),
});

export const fieldCheckInUpdateSchema = fieldCheckInInputSchema.partial();

export const automationRuleInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  channel: channelTypeSchema,
  triggerEvent: z.string().trim().min(2).max(120),
  sendAfterMinutes: z.coerce.number().int().min(0).max(10080).default(0),
  templateSubject: z.string().trim().max(180).optional().nullable(),
  templateBody: z.string().trim().min(5).max(5000),
  status: campaignStatusSchema.default("ACTIVE"),
  clientId: z.string().trim().min(3).max(40).optional().nullable(),
});

export const automationRuleUpdateSchema = automationRuleInputSchema.partial();

export const messageLogInputSchema = z.object({
  recipient: z.string().trim().min(3).max(160),
  channel: channelTypeSchema,
  subject: z.string().trim().max(180).optional().nullable(),
  body: z.string().trim().min(2).max(5000),
  status: messageStatusSchema.default("QUEUED"),
  scheduledFor: z.string().datetime().optional().nullable(),
  sentAt: z.string().datetime().optional().nullable(),
  campaignId: z.string().trim().min(3).max(40).optional().nullable(),
  clientId: z.string().trim().min(3).max(40).optional().nullable(),
});

export const messageLogUpdateSchema = messageLogInputSchema.partial();

export const paymentRecordInputSchema = z.object({
  amountCents: z.coerce.number().int().min(1).max(500000000),
  processor: z.string().trim().min(2).max(60),
  externalReference: z.string().trim().max(120).optional().nullable(),
  status: paymentStatusSchema.default("PENDING"),
  paidAt: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  invoiceId: z.string().trim().min(3).max(40),
});

export const paymentRecordUpdateSchema = paymentRecordInputSchema.partial();

export const paymentProcessorInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  enabled: z.coerce.boolean().default(false),
  sandboxMode: z.coerce.boolean().default(true),
  publishableKeyMasked: z.string().trim().max(120).optional().nullable(),
  webhookUrl: z.string().trim().url().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const paymentProcessorUpdateSchema = paymentProcessorInputSchema.partial();

export const payrollRunInputSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  status: payrollStatusSchema.default("DRAFT"),
  totalGrossCents: z.coerce.number().int().min(0).max(500000000).default(0),
  processedAt: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const payrollRunUpdateSchema = payrollRunInputSchema.partial();

export const payrollEntryInputSchema = z.object({
  payrollRunId: z.string().trim().min(3).max(40),
  employeeId: z.string().trim().min(3).max(40),
  hoursWorked: z.coerce.number().int().min(0).max(300),
  baseRateCents: z.coerce.number().int().min(0).max(200000),
  bonusCents: z.coerce.number().int().min(0).max(50000000).default(0),
  grossCents: z.coerce.number().int().min(0).max(500000000),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const payrollEntryUpdateSchema = payrollEntryInputSchema.partial();

export const availabilityBlockInputSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  type: availabilityTypeSchema.default("BLOCKED"),
  reason: z.string().trim().max(1000).optional().nullable(),
  approved: z.coerce.boolean().default(false),
  employeeId: z.string().trim().min(3).max(40),
});

export const availabilityBlockUpdateSchema = availabilityBlockInputSchema.partial();

export const integrationConnectionInputSchema = z.object({
  provider: z.string().trim().min(2).max(80),
  status: integrationStatusSchema.default("DISCONNECTED"),
  apiKeyMasked: z.string().trim().max(120).optional().nullable(),
  webhookUrl: z.string().trim().url().optional().nullable(),
  syncIntervalMinutes: z.coerce.number().int().min(1).max(1440).default(15),
  lastSyncAt: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const integrationConnectionUpdateSchema = integrationConnectionInputSchema.partial();

export const planTierInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9_]+$/),
  name: z.string().trim().min(2).max(120),
  monthlyPriceCents: z.coerce.number().int().min(0).max(100000000),
  maxUsers: z.coerce.number().int().min(1).max(10000),
  maxClients: z.coerce.number().int().min(1).max(10000),
  maxProperties: z.coerce.number().int().min(1).max(100000),
  apiAccess: z.coerce.boolean().default(false),
  mobileAccess: z.coerce.boolean().default(false),
  automationAccess: z.coerce.boolean().default(false),
});

export const planTierUpdateSchema = planTierInputSchema.partial();

export const exportJobInputSchema = z.object({
  resource: z.string().trim().min(2).max(80),
  format: z.string().trim().min(2).max(20).default("csv"),
  status: exportStatusSchema.default("QUEUED"),
  requestedBy: z.string().trim().max(120).optional().nullable(),
  downloadUrl: z.string().trim().url().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const exportJobUpdateSchema = exportJobInputSchema.partial();

export const idParamSchema = z.object({
  id: z.string().trim().min(3).max(64),
});
