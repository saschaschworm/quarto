import { Radio } from "@headlessui/react";
import { type VotingResultReport } from "@quarto-voting/schemas";
import { useTranslations } from "next-intl";
import { type ComponentPropsWithoutRef, useMemo } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const style = tv({
  slots: {
    container: [
      "group flex flex-col gap-y-4 rounded-lg bg-white p-6 shadow-sm",
      "ring ring-gray-300 data-checked:ring-3 data-checked:ring-indigo-600 data-hover:[&:not([data-checked])]:ring-gray-400",
      "cursor-pointer data-disabled:cursor-default",
    ],
    label: "inline-block text-lg leading-snug text-gray-900",
    bar: "absolute inset-y-0 left-0 rounded-md bg-gray-900",
  },
  variants: {
    published: {
      false: {
        container: "data-disabled:[&:not([data-checked])]:bg-gray-50",
        label: "group-data-disabled:group-[&:not([data-checked])]:text-gray-600",
      },
    },
    solution: { true: {}, false: {}, unknown: {} },
  },
  compoundVariants: [
    {
      published: true,
      solution: false,
      class: { container: "ring-rose-400", bar: "bg-rose-600", label: "text-rose-600" },
    },
    {
      published: true,
      solution: true,
      class: { container: "ring-lime-400", bar: "bg-lime-600", label: "text-lime-600" },
    },
  ],
});

type VotingOptionProps = (Omit<ComponentPropsWithoutRef<typeof Radio>, "children"> &
  Omit<VariantProps<typeof style>, "centered">) & {
  bullet: string;
  label: string | null;
  result: VotingResultReport[keyof VotingResultReport] | null;
};

export const VotingOption = (props: VotingOptionProps) => {
  const t = useTranslations();
  const { bullet, label, result, published = false, solution = false, ...remainder } = props;
  const styles = useMemo(() => style({ published, solution }), [published, solution]);

  return (
    <Radio {...remainder} className={styles.container()}>
      <span className={styles.label()}>
        <span className="mr-4 font-bold">{bullet}</span>
        {label}
      </span>
      {published && (
        <div className="flex flex-col gap-y-2">
          <div className="relative h-4 rounded-md bg-gray-100">
            <div className={styles.bar()} style={{ width: `${result?.pct ?? 0}%` }} />
          </div>
          <div className="flex flex-row justify-between">
            <span className="text-sm text-gray-600">{t("voting.labels.votes", { votes: result?.votes ?? 0 })}</span>
            <span className="text-sm text-gray-600">{result?.pct ?? 0} %</span>
          </div>
        </div>
      )}
    </Radio>
  );
};
