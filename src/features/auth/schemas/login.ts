import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'L’email est requis')
    .email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const setupSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'L’email est requis')
    .email('Email invalide'),
  name: z
    .string()
    .trim()
    .min(1, 'Le nom est requis')
    .max(100, 'Nom trop long'),
  password: z
    .string()
    .min(8, 'Au moins 8 caractères')
    .max(128, 'Mot de passe trop long'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SetupInput = z.infer<typeof setupSchema>;
