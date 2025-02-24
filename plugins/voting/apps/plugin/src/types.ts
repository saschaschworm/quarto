import type { Options as RevealOptions } from "reveal.js";

type Nullable<T> = { [P in keyof T]: T[P] | null };

type VotingRealtimeSettings = { key: string; host: string; cluster: string; channel: string };
type VotingMiddlewareSettings = { endpoint: string; token: string };
type VotingSettings = VotingRealtimeSettings & VotingMiddlewareSettings;
export type VotingConnectionStates = { connecting: string; connected: string; unavailable: string; unknown: string };
export type VotingLabels = { start: string; publish: string; votes: string } & VotingConnectionStates;
export type RevealVotingSettings = RevealOptions & { voting: Nullable<VotingSettings> & { labels: VotingLabels } };
