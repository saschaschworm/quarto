"use server";

import { CREATED, SUBMITTED, UPDATED } from "@quarto-voting/realtime/events";
// eslint-disable-next-line prettier/prettier
import type { CreateVotingPayload, UpdateVotingPayload, VotingConfig, VotingData, VotingOptions, VotingResult, VotingResultReport } from "@quarto-voting/schemas";
import { VotingConfigSchema, VotingOptionsSchema, VotingResultSchema } from "@quarto-voting/schemas";
import { randomUUID as uuid } from "crypto";
import { cookies } from "next/headers";

import { redis } from "@/lib/cache";
import { pusher } from "@/lib/realtime";

// Define the Redis keys for the voting data, i.e., the configuration, options, and results, based on the channel name.
const CONFIG_KEY = (channel: string) => `voting-${channel}-config`;
const OPTIONS_KEY = (channel: string) => `voting-${channel}-options`;
const RESULT_KEY = (channel: string) => `voting-${channel}-votes`;

const build = async (result: VotingResult): Promise<VotingResultReport> => {
  // Calculate the total number of votes from the voting results and then the percentage points for each option,
  // rounding down the percentage points to the nearest integer, keeping track of the remaining percentage points.
  const total = Object.values(result).reduce((sum, count) => sum + count, 0);
  let report = Object.entries(result).map(([key, votes]) => ({ key, total, votes, pct: (votes / total) * 100 }));
  report = report.map(({ key, total, votes, pct }) => ({ key, total, votes, pct: Math.floor(pct) }));
  const difference = 100 - report.reduce((sum, { pct }) => sum + pct, 0);

  // Distribute the remaining percentage points to the options with the highest percentage points to ensure that the
  // sum of all percentage points is 100.
  // eslint-disable-next-line prettier/prettier
  [...report].sort((a, b) => b.pct - a.pct).slice(0, difference).forEach(({ key }) => (report[report.findIndex((item) => item.key === key)].pct += 1));

  // Return the report with the total number of votes, the number of votes for each option, and the percentage of votes
  // for each option.
  const response = report.map((item) => ({ ...item, pct: Number.isNaN(item.pct) ? 0 : item.pct }));
  return Object.fromEntries(response.map(({ key, ...remainder }) => [key, remainder]));
};

export const get = async (channel: string): Promise<VotingData | null> => {
  // Retrive the voting data, i.e., the configuration, options, and results, as separate items from Redis for the given
  // channel. If the resuting array is empty or any of the items is empty or invalid, return null.
  const query = redis.multi().hgetall(CONFIG_KEY(channel)).get(OPTIONS_KEY(channel)).hgetall(RESULT_KEY(channel));
  const response = await query.exec();
  if (!response || response.some((item) => item[0] || ["{}", "null"].includes(JSON.stringify(item[1])))) return null;

  // Parse the voting data, i.e., the configuration, options, and results, from the resulting array and return it. If
  // parsing fails for any of the items, throw an error.
  const config = VotingConfigSchema.parse(response[0][1]);
  const options = VotingOptionsSchema.parse(JSON.parse(response[1][1] as string));
  const result = VotingResultSchema.parse(response[2][1]);
  const report = await build(result);
  return { config, options, report };
};

export const create = async (channel: string, payload: CreateVotingPayload): Promise<VotingData> => {
  // Determine the expiry timestamp of the voting based on the current timestamp and the duration of the voting if it
  // is intended to be running instantaneously; otherwise, set the expiry timestamp to null.
  let expiry = null;
  if (payload.status === "running") expiry = new Date(Date.now() + payload.duration * 1000).toISOString();

  // Create the voting options based on the number of options specified in the payload or the options themselves. If
  // the enumeration is set to "letters", use the uppercase letters of the alphabet as bullets; otherwise, use the
  // numbers starting from 1.
  const options: VotingOptions = [];
  const length = typeof payload.options === "number" ? payload.options : payload.options.length;
  for (let index = 0; index < length; index++) {
    const bullet = payload.enumeration === "letters" ? String.fromCharCode(65 + index) : (index + 1).toString();
    options.push({ id: uuid(), bullet, label: typeof payload.options === "number" ? null : payload.options[index] });
  }

  // Determine the solution of the voting based on the solution index specified in the payload or null if no solution
  // is specified. Then, create the voting configuration based on the payload and the derived values for the expiry and
  // solution, and the voting results based on the options with an initial count of 0.
  const solution = payload.solution ? options[payload.solution - 1].id : null;
  const config = VotingConfigSchema.parse({ ...payload, expiry, solution });
  const result: VotingResult = options.reduce((acc, option) => ({ ...acc, [option.id]: 0 }), {});
  const report = await build(result);

  // Store the voting data, i.e., the configuration, options, and results, as separate items in Redis for the given
  // channel with a time-to-live (TTL) of 24 hours. If storing the data fails, throw an error.
  const ttl = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  let query = redis.multi().hset(CONFIG_KEY(channel), config).expireat(CONFIG_KEY(channel), ttl);
  query = query.del(RESULT_KEY(channel)).hset(RESULT_KEY(channel), result).expireat(RESULT_KEY(channel), ttl);
  await query.set(OPTIONS_KEY(channel), JSON.stringify(options)).expireat(OPTIONS_KEY(channel), ttl).exec();

  // Broadcast the voting data to the channel and return it.
  pusher.trigger(channel, CREATED, { config, options, report }).catch(() => {});
  return { config, options, report };
};

export const update = async (channel: string, payload: UpdateVotingPayload): Promise<VotingConfig | null> => {
  // Retrieve the voting configuration from Redis for the given channel. If it does not exist, return null.
  const voting = await get(channel);
  if (!voting) return null;

  // Update the voting configuration based on the payload and the current status of the voting, setting the expiry
  // timestamp to the current timestamp if the voting is stopped or finished, or to null if the voting is published.
  let config = { ...voting.config, ...payload };
  if (payload.status === "running") config.expiry = new Date(Date.now() + voting.config.duration * 1000).toISOString();
  if (payload.status === "stopped" || payload.status === "finished") config.expiry = new Date(Date.now()).toISOString();
  if (payload.published) config.expiry = new Date(0).toISOString();
  config = VotingConfigSchema.parse(config);

  // Store the updated voting configuration in Redis for the given channel. If storing the data fails, throw an error.
  const response = await redis.multi().hset(CONFIG_KEY(channel), config).hgetall(CONFIG_KEY(channel)).exec();
  if (!response || response.some((item) => item[0] || ["{}", "null"].includes(JSON.stringify(item[1])))) return null;

  // Broadcast the updated voting config to the channel and return it.
  pusher.trigger(channel, UPDATED, config).catch(() => {});
  return config;
};

export const vote = async (channel: string, voting: string, selection: string): Promise<VotingResultReport | null> => {
  // Retrieve the channel cookie from the request headers and check if it contains the voting and selection values. If
  // it does, return early to prevent duplicate votes from the same client.
  const store = await cookies();
  const cookie = store.get(channel);
  if (cookie && cookie.value === `${voting}:${selection}`) return null;

  // Increment the vote count for the selected option in the voting results and retrieve the updated voting results. If
  // the response is empty or any of the items is empty or invalid, return early.
  const response = await redis.multi().hincrby(RESULT_KEY(channel), selection, 1).hgetall(RESULT_KEY(channel)).exec();
  if (!response || response.some((item) => item[0] || !item[1])) return null;

  // Parse the voting results from the resulting array and build the voting result report. If parsing fails, throw an
  // error, otherwise broadcast the the voting result report to the channel.
  const result = VotingResultSchema.parse(response[1][1]);
  const report = await build(result);
  pusher.trigger(channel, SUBMITTED, report).catch(() => {});

  // Store the voting and selection values in the channel cookie with a time-to-live (TTL) of 24 hours and return the
  // voting result report.
  type Cookie = Parameters<typeof store.set>[2];
  const payload: Cookie = { secure: true, sameSite: "lax", httpOnly: true, expires: Date.now() + 1000 * 60 * 60 * 24 };
  store.set(channel, `${voting}:${selection}`, payload);
  return report;
};
