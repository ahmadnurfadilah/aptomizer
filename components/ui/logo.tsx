import { cn } from "@/lib/utils";
import * as React from "react";

const Logo = (props: { className?: string }) => (
  <div className={cn("flex items-center text-sm gap-px font-bold", props.className)}>
    AptoMizer
  </div>
);

export default Logo;
