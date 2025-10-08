import { z } from 'zod';

export const CreateBuildSchema = z.object({
  name: z.string().min(2),
  buildType: z.string(),
  components: z.record(z.string(), z.unknown()),
});

export const UpdateBuildSchema = z.object({
  name: z.string().min(2).optional(),
  isPublic: z.boolean().optional(),
});

export const CreatePriceSchema = z.object({
  productType: z.string().min(1),
  productId: z.string().min(1),
  retailer: z.string().min(1),
  priceCents: z.number().int().positive(),
  currency: z.string().default('USD'),
  url: z.string().url().optional(),
  inStock: z.boolean().optional(),
});

export const DeletePriceSchema = z.object({
  productType: z.string().min(1),
  productId: z.string().min(1),
  retailer: z.string().min(1),
  timestamp: z.string().min(1), // ISO string
});

export const UpdatePriceSchema = z.object({
  productType: z.string().min(1),
  productId: z.string().min(1),
  retailer: z.string().min(1),
  timestamp: z.string().min(1), // ISO string identifying the row
  newRetailer: z.string().min(1).optional(),
  url: z.string().url().optional(),
});

export const InitialCostSchema = z.object({
  equipment: z.object({
    filter: z.string().optional(),
    heater: z.string().optional(),
    light: z.string().optional(),
    substrate: z.string().optional(),
    extras: z.array(z.string()).default([]),
  }),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(50),
});

export const CreateAlertSchema = z.object({
  userId: z.string().min(1),
  productType: z.string().min(1),
  productId: z.string().min(1),
  targetCents: z.number().int().positive(),
});

export const BuildsListQuerySchema = z.object({
  type: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export const AnalyticsEventSchema = z.object({
  name: z.string().min(1),
  props: z.record(z.unknown()).default({}),
});
