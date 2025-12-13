import { z } from 'zod';

const networkEnum = z.enum(['mtn', 'airtel', 'glo', '9mobile']);
const airtimeTypeEnum = z.enum(['sme', 'cg', 'gifting']);

export const airtimeBuySchema = z.object({
  network: networkEnum,
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  amount: z.number().min(50, 'Minimum amount is 50').max(50000, 'Maximum amount is 50,000'),
  type: airtimeTypeEnum.optional().default('sme'),
});

export const dataBuySchema = z.object({
  network: networkEnum,
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  planId: z.string().min(1, 'Plan ID is required'),
  planName: z.string().optional(),
  amount: z.number().min(50, 'Minimum amount is 50'),
  type: airtimeTypeEnum.optional().default('sme'),
});

export const electricityBuySchema = z.object({
  discoName: z.string().min(1, 'Disco name is required'),
  meterNumber: z.string().min(5, 'Invalid meter number'),
  meterType: z.enum(['prepaid', 'postpaid']).optional().default('prepaid'),
  amount: z.number().min(500, 'Minimum amount is 500').max(100000, 'Maximum amount is 100,000'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number').optional(),
});

export const electricityValidateSchema = z.object({
  discoName: z.string().min(1, 'Disco name is required'),
  meterNumber: z.string().min(5, 'Invalid meter number'),
  meterType: z.enum(['prepaid', 'postpaid']).optional().default('prepaid'),
});

export const cableBuySchema = z.object({
  provider: z.enum(['dstv', 'gotv', 'startimes']),
  smartcardNumber: z.string().min(5, 'Invalid smartcard number'),
  package: z.string().min(1, 'Package is required'),
  amount: z.number().min(500, 'Minimum amount is 500'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number').optional(),
  subscriptionType: z.enum(['renew', 'change']).optional().default('renew'),
});

export const cableValidateSchema = z.object({
  provider: z.enum(['dstv', 'gotv', 'startimes']),
  smartcardNumber: z.string().min(5, 'Invalid smartcard number'),
});

export const birthAttestationSchema = z.object({
  fullName: z.string().min(3, 'Full name is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  registrationNumber: z.string().optional(),
  placeOfBirth: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
});

export type AirtimeBuyInput = z.infer<typeof airtimeBuySchema>;
export type DataBuyInput = z.infer<typeof dataBuySchema>;
export type ElectricityBuyInput = z.infer<typeof electricityBuySchema>;
export type ElectricityValidateInput = z.infer<typeof electricityValidateSchema>;
export type CableBuyInput = z.infer<typeof cableBuySchema>;
export type CableValidateInput = z.infer<typeof cableValidateSchema>;
export type BirthAttestationInput = z.infer<typeof birthAttestationSchema>;
