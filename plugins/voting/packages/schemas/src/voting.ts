import { z } from "zod";

export const VotingConfigSchema = z.object({
  id: z.string().trim(),
  question: z.preprocess((v) => (v === "" ? null : v), z.string().trim().min(1).nullable().default(null)),
  // eslint-disable-next-line prettier/prettier
  duration: z.coerce.number().int().nullish().transform((v) => v ?? 120),
  expiry: z.preprocess((v) => (v === "" ? null : v), z.coerce.string().trim().datetime().nullable().default(null)),
  solution: z.preprocess((v) => (v === "" ? null : v), z.coerce.string().trim().nullable().default(null)),
  // eslint-disable-next-line prettier/prettier
  published: z.preprocess((v) => (typeof v === "string" && v === "true" ? true : typeof v === "boolean" ? v : false), z.coerce.boolean()),
  status: z.enum(["stopped", "running", "finished"]).default("stopped"),
});

export const VotingOptionsSchema = z.array(
  z.object({
    id: z.string().trim().uuid(),
    bullet: z.string().trim().min(1),
    label: z.preprocess((v) => (v === "" ? null : v), z.string().trim().min(1).nullable().default(null)),
  }),
);

export const CreateVotingSchema = VotingConfigSchema.omit({ expiry: true, solution: true }).extend({
  solution: z.coerce.number().int().nullable().default(null),
  options: z.union([z.array(z.string().trim().min(1)).min(2), z.coerce.number().gte(2)]),
  enumeration: z.enum(["letters", "numbers", "binary"]),
});

export const VotingResultReportSchema = z.record(
  z.string().trim().uuid(),
  z.object({
    total: z.coerce.number().int().min(0),
    votes: z.coerce.number().int().min(0),
    pct: z.coerce.number().int().min(0).max(100),
  }),
);

export const VotingResultSchema = z.record(z.string().trim().uuid(), z.coerce.number().int().gte(0).default(0));
export const UpdateVotingSchema = VotingConfigSchema.pick({ published: true, status: true }).partial();

export type VotingConfig = z.infer<typeof VotingConfigSchema>;
export type VotingOptions = z.infer<typeof VotingOptionsSchema>;
export type VotingResult = z.infer<typeof VotingResultSchema>;
export type VotingResultReport = z.infer<typeof VotingResultReportSchema>;
export type CreateVotingPayload = z.infer<typeof CreateVotingSchema>;
export type UpdateVotingPayload = z.infer<typeof UpdateVotingSchema>;
export type VotingData = { config: VotingConfig; options: VotingOptions; report: VotingResultReport };
