import de from "@/locales/de.json";

type Locales = { de: typeof de };
type Messages = Locales[keyof Locales];

declare global {
  type IntlMessages = Messages;
}
