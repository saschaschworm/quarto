import Pusher from "pusher";

import { SOKETI } from "@/config/env";

const { APP_ID, APP_KEY, APP_SECRET, ADDRESS } = SOKETI;
export const pusher = new Pusher({ host: ADDRESS, appId: APP_ID, key: APP_KEY, secret: APP_SECRET });
