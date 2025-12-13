import { z } from 'zod';

export const ninLookupSchema = z.object({
  nin: z.string().length(11, 'NIN must be exactly 11 digits').regex(/^[0-9]+$/, 'NIN must contain only digits'),
});

export const ninPhoneSchema = z.object({
  nin: z.string().length(11, 'NIN must be exactly 11 digits').regex(/^[0-9]+$/, 'NIN must contain only digits'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
});

export const lostNinSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  enrollmentId: z.string().min(1, 'Enrollment ID is required').optional(),
  dateOfBirth: z.string().optional(),
  fullName: z.string().optional(),
});

export type NinLookupInput = z.infer<typeof ninLookupSchema>;
export type NinPhoneInput = z.infer<typeof ninPhoneSchema>;
export type LostNinInput = z.infer<typeof lostNinSchema>;
