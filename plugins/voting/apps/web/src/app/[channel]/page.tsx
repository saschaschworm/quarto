import { cookies } from "next/headers";

import { ConnectionStatusBar } from "@/components/core";
import { VotingManager } from "@/components/voting";
import { get } from "@/services/voting";

const VotingPage = async ({ params }: { params: Promise<{ channel: string }> }) => {
  // Retrieve the channel from the route parameters and fetch the voting data, i.e., the configuration, options, and
  // report, from Redis for the given channel
  const { channel } = await params;
  const voting = await get(channel);

  // Retrieve the channel cookie from the request headers and check if it contains the voting and selection values. If
  // it does, prevent the user from voting again.
  const cookie = (await cookies()).get(channel);
  const selection = cookie?.value.startsWith(`${voting?.config.id}:`) ? cookie.value.split(":")[1] : null;

  return (
    <div className="flex min-h-screen flex-col">
      <ConnectionStatusBar />
      <VotingManager channel={channel} voting={voting} selection={selection} />
    </div>
  );
};

export default VotingPage;
