"use client";

import { TOOL_COMPONENTS } from "@/components/tools";

export function ToolHost({ component }: { component: string }) {
  const Component = TOOL_COMPONENTS[component];
  if (!Component) return null;
  return <Component />;
}