import { z } from 'zod'

// Public self-registration: only UNIVERSITY and VERIFIER can sign up themselves.
// HOLDER accounts are provisioned by UNIVERSITY users via the /holders routes.
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long'),
  role: z
    .enum(['UNIVERSITY', 'VERIFIER'], {
      errorMap: () => ({ message: 'Role must be UNIVERSITY or VERIFIER' }),
    })
    .optional()
    .default('VERIFIER'),
})

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})

export const updateWalletSchema = z.object({
  walletAddress: z
    .string()
    .trim()
    .regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid Ethereum wallet address')
    .nullable()
    .optional(),
})

// Used by UNIVERSITY users to create HOLDER accounts
export const createHolderSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  walletAddress: z
    .string()
    .trim()
    .max(255, 'Wallet address too long')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
})
