import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  return { locale: "de", messages: (await import("@/locales/de.json")).default };
});
