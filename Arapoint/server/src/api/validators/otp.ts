import { z } from 'zod';

export const sendOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
  purpose: z.enum(['registration', 'password_reset']).default('registration'),
});

export const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits'),
  purpose: z.enum(['registration', 'password_reset']).default('registration'),
});

export const registerWithOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export type SendOTPInput = z.infer<typeof sendOTPSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type RegisterWithOTPInput = z.infer<typeof registerWithOTPSchema>;
