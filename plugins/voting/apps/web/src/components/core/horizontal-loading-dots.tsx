import { ComponentPropsWithoutRef } from "react";

export const HorizontalLoadingDots = (props: ComponentPropsWithoutRef<"svg">) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" {...props} width="24" height="24" viewBox="0 0 24 24">
      <circle
        cx="4"
        cy="12"
        r="3"
        className="animate-[dots_0.8s_linear_infinite] fill-current"
        style={{ animationDelay: "-0.8s" }}
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        className="animate-[dots_0.8s_linear_infinite] fill-current"
        style={{ animationDelay: "-0.65s" }}
      />
      <circle
        cx="20"
        cy="12"
        r="3"
        className="animate-[dots_0.8s_linear_infinite] fill-current"
        style={{ animationDelay: "-0.5s" }}
      />
    </svg>
  );
};
