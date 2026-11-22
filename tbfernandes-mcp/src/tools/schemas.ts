import { z } from 'zod';

export const uuid = z.string().uuid();
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'use AAAA-MM-DD');

export const studyStatus = z.enum([
  'planned',
  'in_progress',
  'paused',
  'completed',
]);
export const materialType = z.enum([
  'video',
  'article',
  'book',
  'docs',
  'course',
  'repository',
  'paper',
  'note',
]);
export const materialStatus = z.enum([
  'to_consume',
  'in_progress',
  'consumed',
  'reviewed',
]);
export const goalArea = z.enum([
  'career',
  'finance',
  'learning',
  'health',
  'personal',
]);
export const goalStatus = z.enum(['planned', 'active', 'paused', 'completed']);
export const goalPriority = z.enum(['low', 'normal', 'high']);

export const yearMonth = z.string().regex(/^\d{4}-\d{2}$/, 'use AAAA-MM');
export const entryKind = z.enum(['income', 'expense']);
export const entryScope = z.enum(['personal', 'business']);
