import { z } from 'zod';

export const paystackInitSchema = z.object({
  amount: z.number().min(100, 'Minimum amount is 100').max(10000000, 'Maximum amount is 10,000,000'),
  email: z.string().email('Invalid email format').optional(),
});

export const paystackVerifySchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
});

export const palmpayInitSchema = z.object({
  amount: z.number().min(100, 'Minimum amount is 100').max(10000000, 'Maximum amount is 10,000,000'),
});

export const palmpayVerifySchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
});

export const walletFundSchema = z.object({
  amount: z.number().min(100, 'Minimum amount is 100').max(10000000, 'Maximum amount is 10,000,000'),
  paymentMethod: z.enum(['paystack', 'palmpay', 'bank_transfer']).optional().default('paystack'),
});

export type PaystackInitInput = z.infer<typeof paystackInitSchema>;
export type PaystackVerifyInput = z.infer<typeof paystackVerifySchema>;
export type PalmpayInitInput = z.infer<typeof palmpayInitSchema>;
export type PalmpayVerifyInput = z.infer<typeof palmpayVerifySchema>;
export type WalletFundInput = z.infer<typeof walletFundSchema>;
