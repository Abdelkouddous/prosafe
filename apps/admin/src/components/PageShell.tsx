import type { ReactNode } from "react";
import WorkspaceShell from "@/components/WorkspaceShell";

const PageShell = ({
  title,
  subtitle,
  actions,
  children,
  fullHeight,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  fullHeight?: boolean;
}) => (
  <WorkspaceShell
    title={title}
    subtitle={subtitle}
    actions={actions}
    fullHeight={fullHeight}
  >
    {children}
  </WorkspaceShell>
);

export default PageShell;
