import { z } from "zod";

export const loginInputSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(6).max(256),
});

export const leadInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(25).optional().nullable(),
  company: z.string().trim().max(120).optional().nullable(),
  serviceNeeded: z.string().trim().max(120).optional().nullable(),
  message: z.string().trim().min(10).max(3000),
  source: z.string().trim().max(60).default("website"),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]).default("NEW"),
});

export const workOrderInputSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(4000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z
    .enum(["BACKLOG", "SCHEDULED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELED"])
    .default("BACKLOG"),
  assignee: z.string().trim().max(120).optional().nullable(),
  estimatedHours: z.coerce.number().int().min(1).max(240).optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
  clientId: z.string().trim().min(3).optional().nullable(),
  propertyId: z.string().trim().min(3).optional().nullable(),
});
