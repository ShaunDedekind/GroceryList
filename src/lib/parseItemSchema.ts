import { z } from 'zod'

export const parsedItemSchema = z.object({
  title: z.string().min(1),
  tab: z.enum(['home', 'henry']),
  category: z.string().min(1),
  owner: z.enum(['shaun', 'rosie', 'shared']).default('shared'),
  item_kind: z
    .enum(['task', 'bill', 'session', 'maintenance', 'purchase', 'milestone'])
    .default('task'),
  due_at: z.string().nullable().optional(),
  recurrence: z
    .object({
      freq: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'seasonal']),
      interval: z.number().int().positive().optional(),
      byMonth: z.array(z.number().int().min(1).max(12)).optional(),
      until: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  amount_cents: z.number().int().nullable().optional(),
  provider: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).default(0.5),
  note: z.string().nullable().optional(),
})

export type ParsedItem = z.infer<typeof parsedItemSchema>
