import { z } from 'zod';

// ── Auth ────────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email обов\'язковий')
      .email('Невірний формат email')
      .max(254, 'Email занадто довгий')
      .transform((v) => v.trim().toLowerCase()),
    name: z
      .string()
      .min(1, 'Ім\'я обов\'язкове')
      .max(100, 'Ім\'я занадто довге')
      .transform((v) => v.trim()),
    password: z
      .string()
      .min(8, 'Пароль має містити мінімум 8 символів')
      .max(128, 'Пароль занадто довгий (максимум 128 символів)'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email обов\'язковий')
      .email('Невірний формат email')
      .max(254, 'Email занадто довгий')
      .transform((v) => v.trim().toLowerCase()),
    password: z
      .string()
      .min(1, 'Пароль обов\'язковий')
      .max(128, 'Пароль занадто довгий'),
  })
  .strict();

// ── Events ──────────────────────────────────────────────────────────────

export const createEventSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Назва обов\'язкова')
      .max(120, 'Назва занадто довга (максимум 120 символів)')
      .transform((v) => v.trim()),
    description: z
      .string()
      .min(1, 'Опис обов\'язковий')
      .max(5000, 'Опис занадто довгий (максимум 5000 символів)')
      .transform((v) => v.trim()),
    startsAt: z.string().refine(
      (v) => {
        const d = new Date(v);
        return !isNaN(d.getTime()) && d > new Date();
      },
      'Дата має бути в майбутньому',
    ),
    capacity: z.coerce
      .number()
      .int('Кількість місць має бути цілим числом')
      .min(1, 'Мінімум 1 місце')
      .max(10000, 'Максимум 10000 місць'),
    visibility: z.enum(['PUBLIC', 'PRIVATE']),
  })
  .strict();

export const updateEventSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Назва обов\'язкова')
      .max(120, 'Назва занадто довга (максимум 120 символів)')
      .transform((v) => v.trim())
      .optional(),
    description: z
      .string()
      .min(1, 'Опис обов\'язковий')
      .max(5000, 'Опис занадто довгий (максимум 5000 символів)')
      .transform((v) => v.trim())
      .optional(),
    startsAt: z
      .string()
      .refine(
        (v) => {
          const d = new Date(v);
          return !isNaN(d.getTime()) && d > new Date();
        },
        'Дата має бути в майбутньому',
      )
      .optional(),
    capacity: z.coerce
      .number()
      .int('Кількість місць має бути цілим числом')
      .min(1, 'Мінімум 1 місце')
      .max(10000, 'Максимум 10000 місць')
      .optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  })
  .strict();

// ── Comments ────────────────────────────────────────────────────────────

export const commentSchema = z
  .object({
    content: z
      .string()
      .min(1, 'Коментар не може бути порожнім')
      .max(1000, 'Коментар занадто довгий (максимум 1000 символів)')
      .transform((v) => v.trim()),
  })
  .strict();

// ── Search ──────────────────────────────────────────────────────────────

export const searchSchema = z.object({
  q: z.string().max(100, 'Запит занадто довгий').optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
});

// ── Shared types ────────────────────────────────────────────────────────

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  message?: string;
} | null;
