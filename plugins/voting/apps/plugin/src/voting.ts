import "./assets/voting.css";

import { SUBMITTED } from "@quarto-voting/realtime/events";
import type { VotingConfig, VotingData, VotingResultReport } from "@quarto-voting/schemas";
import Pusher, { type Channel as PusherChannel, type Options as PusherOptions } from "pusher-js";
import type { Plugin } from "reveal.js";
import type Reveal from "reveal.js";

import type { RevealVotingSettings, VotingConnectionStates } from "./types";

const RevealVoting = (): Plugin => {
  let voting: VotingData | null;
  let pusher: Pusher;
  let subscription: PusherChannel;
  let remaining: number;

  return {
    id: "voting",
    init: async (deck: Reveal.Api) => {
      // Parse the voting settings from the deck configuration. If the settings are invalid, return early.
      const settings = deck.getConfig() as RevealVotingSettings;
      const { key, host, cluster, channel, endpoint, token, labels } = settings.voting;
      if (!key || !channel || !endpoint || !token) return;

      // Determine whether to use the host or cluster for the Pusher options. If a cluster is given, then Pusher will
      // use the default host for the cluster. Otherwise, if a host is given, then Pusher will use the host directly.
      // If neither a host nor a cluster is given, then return early.
      let options: PusherOptions;
      if (host) options = { wsHost: host, cluster: "local" };
      else if (cluster) options = { cluster };
      else return;

      // Initialize the Pusher client with the given key and options and subscribe to the given channel.
      pusher = new Pusher(key, { ...options, disableStats: true, forceTLS: true, enabledTransports: ["ws", "wss"] });
      subscription = pusher.subscribe(channel);

      // Listen for connection state changes and set the voting notification accordingly.
      pusher.connection.bind("state_change", (states: { current: keyof VotingConnectionStates }) => {
        const notification = document.querySelector(".quarto-voting-notification");
        if (!notification) return;
        notification.textContent = labels[states.current] ?? "Unknown";
        notification.setAttribute("data-voting-connection", states.current);
      });

      // Listen for voting events, i.e., when a vote is submitted. If a voting is running, then update the voting data
      // with the new vote. If a voting is not running, then ignore the event.
      subscription.bind(SUBMITTED, (data: VotingResultReport) => {
        if (voting) voting.report = data;
      });

      // Create the toolbar element for the voting plugin.
      const toolbar = document.createElement("div");
      toolbar.id = "quarto-voting-toolbar";
      toolbar.setAttribute("data-voting-hidden", "true");

      // Add the countdown element to the toolbar.
      const countdown = document.createElement("span");
      countdown.classList.add("quarto-voting-countdown");
      countdown.textContent = "00:00";
      toolbar.append(countdown);

      // Add the menu container element to the toolbar.
      const menu = document.createElement("div");
      menu.classList.add("quarto-voting-menu");

      // Add the notification element to the menu.
      const notification = document.createElement("div");
      notification.classList.add("quarto-voting-notification");
      notification.textContent = "Unknown";
      notification.setAttribute("data-voting-connection", "unknown");
      menu.append(notification);

      // Add the start and publish buttons to the menu.
      const startbutton = document.createElement("button");
      startbutton.classList.add("quarto-voting-button", "quarto-voting-button-start");
      startbutton.textContent = labels.start ?? "Start";
      menu.append(startbutton);

      const publishbutton = document.createElement("button");
      publishbutton.classList.add("quarto-voting-button", "quarto-voting-button-publish");
      publishbutton.textContent = labels.publish ?? "Publish";
      menu.append(publishbutton);

      // Append the menu container to the toolbar and the toolbar to the container.
      toolbar.append(menu);
      const container = document.querySelector(".reveal") as HTMLElement;
      container.append(toolbar);

      // Create a timer that updates the countdown element every second. This function is called when the current slide
      // is a voting slide and a voting is started. The timer is cleared when the voting is published.
      const timer = (expiry: string) => {
        const timstamp = new Date(expiry).getTime();
        const update = () => {
          const remaining = Math.max(timstamp - Date.now(), 0);
          const minutes = String(Math.floor(remaining / 60000)).padStart(2, "0");
          const seconds = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
          countdown.textContent = `${minutes}:${seconds}`;
          return remaining > 0;
        };
        if (!update()) return;
        remaining = setInterval(() => {
          if (!update()) clearInterval(remaining);
        }, 1000);
      };

      /* @ts-expect-error The current slide is not defined in the event type. */
      deck.on("slidechanged", async ({ currentSlide: slide }: { currentSlide: Element }) => {
        // Reset the countdown if the current slide has changed.
        if (remaining) clearInterval(remaining);
        countdown.textContent = "00:00";

        // If the current slide is not a voting slide, then hide the toolbar and return early.
        if (!slide.classList.contains("quarto-voting")) toolbar.setAttribute("data-voting-hidden", "true");
        if (!slide.classList.contains("quarto-voting")) return;
        else toolbar.setAttribute("data-voting-hidden", "false");

        // Extract the question, options, solution, and duration from the current slide. If the question or options are
        // not defined, then return early.
        const question = slide.querySelector(".quarto-voting-question > p")?.textContent;
        const options = slide.querySelectorAll(".quarto-voting-options > ol li");
        const solution = Number(slide.getAttribute("data-voting-solution")) || null;
        const duration = slide.getAttribute("data-voting-duration") || "120";
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
        if (!question || options.length === 0) return;

        // Bind an event listener to the start button. When the start button is clicked, send a POST request to the
        // endpoint with the voting data. If the request is successful, then update the voting data with the new voting.
        startbutton.onclick = async () => {
          options.forEach((option) => option.removeAttribute("data-voting-solution"));
          options.forEach((option) => option.querySelector(".quarto-voting-result-container")?.remove());
          // eslint-disable-next-line prettier/prettier
          const payload = { id: slide.id, question, solution, duration, options: [...options].map((val) => val.textContent!), status: "running", enumeration: "letters" }
          // eslint-disable-next-line prettier/prettier
          const response = await fetch(`${endpoint}/api/${channel}`, { method: "POST", headers, body: JSON.stringify(payload) });
          const result = (await response.json()) as VotingData | null;
          if (result) voting = result;
          if (result && result.config.expiry) timer(result.config.expiry);
        };

        // Bind an event listener to the publish button. When the publish button is clicked, send a PATCH request to
        // the endpoint with the voting data. If the request is successful, then update the voting data with the new
        // voting and clear the countdown timer.
        publishbutton.onclick = async () => {
          // eslint-disable-next-line prettier/prettier
          const response = await fetch(`${endpoint}/api/${channel}`, { method: "PATCH", headers, body: JSON.stringify({ published: true, status: "stopped" }) });
          const result = (await response.json()) as VotingConfig | null;
          if (result && voting) voting.config = result;

          options.forEach((option, index) => {
            if (solution && solution === index + 1) option.setAttribute("data-voting-solution", "true");
            else if (solution) option.setAttribute("data-voting-solution", "false");

            const container = option.querySelector(".quarto-voting-result-container") || document.createElement("div");
            container.classList.value = "quarto-voting-result-container";

            const background = document.createElement("div");
            background.classList.value = "quarto-voting-bar-background";

            const bar = document.createElement("div");
            bar.classList.value = "quarto-voting-bar";
            const [, report] = Object.entries(voting!.report)[index];
            bar.style.width = `${report.pct}%`;

            background.append(bar);
            container.append(background);

            const result = document.createElement("div");
            result.classList.value = "quarto-voting-result";
            let element = document.createElement("span");
            element.textContent = `${report.votes} ${labels.votes || "Votes"}`;
            result.append(element);

            element = document.createElement("span");
            element.textContent = `${report.pct} %`;
            result.append(element);

            container.append(result);

            option.append(container);
          });

          if (remaining) clearInterval(remaining);
          countdown.textContent = "00:00";
        };
      });
    },
    destroy: async () => {
      // Unbind all event listeners, unsubscribe from the channel, and disconnect from Pusher.
      if (subscription) subscription.unbind_all();
      if (subscription) pusher.unsubscribe(subscription.name);
      if (pusher) pusher.unbind_all();
      if (pusher) pusher.disconnect();
    },
  };
};

export default RevealVoting;
