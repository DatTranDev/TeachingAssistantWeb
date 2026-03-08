import { z } from 'zod';

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Tên môn học là bắt buộc'),
  code: z.string().min(1, 'Mã môn học là bắt buộc'),
  maxAbsences: z.number().int().min(0).optional(),
});

export type CreateSubjectFormValues = z.infer<typeof createSubjectSchema>;
