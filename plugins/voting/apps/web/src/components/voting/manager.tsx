"use client";

import { RadioGroup } from "@headlessui/react";
import { CREATED, SUBMITTED, UPDATED } from "@quarto-voting/realtime/events";
import type { VotingConfig, VotingData, VotingOptions, VotingResultReport } from "@quarto-voting/schemas";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import Countdown, { type CountdownRenderProps, zeroPad } from "react-countdown";

import { usePusher } from "@/providers/pusher";
import { vote } from "@/services/voting";

import { VotingOption } from "./option";

type VotingManagerProps = { channel: string; voting: VotingData | null; selection: string | null };
type VotingManagerState = Pick<VotingManagerProps, "selection"> & { disabled: boolean; expired: boolean };

export const VotingManager = ({ channel, voting, selection }: VotingManagerProps) => {
  const t = useTranslations();
  const { subscribe, unsubscribe } = usePusher();

  // Create a motion value for the remaining time of the voting and a transform to calculate the progress width.
  const remaining = useMotionValue(0);
  const progressWidth = useTransform(remaining, [0, 1], ["0%", "100%"]);

  // Set the initial state of the voting manager component.
  const [state, setState] = useState<VotingManagerState>({ selection, disabled: !!selection, expired: false });
  const [config, setConfig] = useState<VotingConfig | null>(voting?.config ?? null);
  const [options, setOptions] = useState<VotingOptions>(voting?.options ?? []);
  const [result, setResult] = useState<VotingResultReport | null>(voting?.report ?? null);

  // Submit the vote to the server when the user clicks the vote button. The vote is only submitted if a valid option
  // is selected and a voting is available. It uses a callback to prevent unnecessary re-renders.
  const submit = useCallback(async () => {
    if (!config || !state.selection) return;
    await vote(channel, config.id, state.selection);
    setState((state) => ({ ...state, disabled: true }));
  }, [channel, config, state.selection]);

  // Calculate the expiry date of the voting based on the config. If the config does not exist, set the expiry to the
  // Unix epoch. It's memoized to prevent unnecessary recalculations.
  const expiry = useMemo(() => {
    if (config && config.expiry) return config.expiry;
    else return new Date(0).toISOString();
  }, [config]);

  // Render the countdown timer for the voting.
  const renderer = ({ minutes, seconds }: CountdownRenderProps) => (
    <div className="font-mono text-xl font-semibold text-gray-900" suppressHydrationWarning>
      {zeroPad(minutes)}:{zeroPad(seconds)}
    </div>
  );

  useEffect(() => {
    // Subscribe to the voting created event and create the config, options, and results when the event is triggered.
    subscribe<VotingData>("channel", channel, CREATED, (data) => {
      setConfig(data.config);
      setOptions(data.options);
      setResult(data.report);
      setState((state) => ({ ...state, disabled: false, selection: null }));
    });

    // Subscribe to the voting updated event and update the config when the event is triggered.
    subscribe<VotingConfig>("channel", channel, UPDATED, (config) => setConfig(() => config));

    // Subscribe to the voting results event and update the results when the event is triggered.
    subscribe<VotingResultReport>("channel", channel, SUBMITTED, (results) => setResult(() => results));

    return () => {
      // Unsubscribe from the voting events when the component is unmounted.
      unsubscribe("channel", channel);
    };
  }, [channel, subscribe, unsubscribe]);

  return (
    <>
      <div className="flex grow flex-col items-center justify-center p-8">
        <div className="flex w-full max-w-2xl flex-col gap-y-8">
          {config ? (
            <>
              {config.question && <p className="text-2xl font-semibold text-gray-900">{config.question}</p>}
              <RadioGroup
                className="flex flex-col gap-y-4"
                value={state.selection}
                onChange={(value) => setState((state) => ({ ...state, selection: value }))}
                disabled={state.disabled || config.status !== "running" || state.expired}
              >
                {options.map(({ id, bullet, label }) => (
                  <VotingOption
                    key={id}
                    bullet={bullet}
                    value={id}
                    label={label}
                    result={result && result[id]}
                    published={config.published}
                    solution={config.solution === null ? "unknown" : config.solution === id}
                  />
                ))}
              </RadioGroup>
              <div className="flex flex-row items-center justify-between">
                <button
                  className="cursor-pointer rounded-md bg-indigo-600 px-4 pt-2 pb-1.5 leading-8 font-semibold tracking-widest text-gray-50 uppercase enabled:hover:bg-indigo-500 disabled:cursor-default disabled:bg-gray-200 disabled:text-gray-400"
                  disabled={state.disabled || state.expired || config.status !== "running" || !state.selection}
                  onClick={submit}
                >
                  {t("voting.buttons.vote")}
                </button>
                <Countdown
                  key={expiry}
                  date={expiry}
                  renderer={renderer}
                  onStart={() => setState((state) => ({ ...state, expired: false }))}
                  onComplete={() => {
                    setState((state) => ({
                      ...state,
                      expired: true,
                      selection: state.disabled ? state.selection : null,
                    }));
                    animate(remaining, 0, { duration: 0.2, ease: "easeOut" });
                  }}
                  onTick={({ total }) =>
                    animate(remaining, total / 1000 / config.duration, { duration: 0.2, ease: "easeOut" })
                  }
                />
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center">
              <p className="text-2xl font-medium tracking-widest uppercase">{t("voting.states.empty.title")}</p>
            </div>
          )}
        </div>
      </div>
      <motion.div className="relative h-5 bg-gray-200">
        <motion.div className="absolute inset-y-0 bg-indigo-600" style={{ width: progressWidth }} />
      </motion.div>
    </>
  );
};
