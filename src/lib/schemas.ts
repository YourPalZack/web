import { z } from 'zod';

export const CreateBuildSchema = z.object({
  name: z.string().min(2),
  buildType: z.string(),
  components: z.record(z.string(), z.unknown()),
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

