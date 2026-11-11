import { Fragment, type ReactNode } from "react";
import { useManagementSession } from "comm/management";
import Feedback from "../Feedback/index";

export type ManagementSession = NonNullable<
  ReturnType<typeof useManagementSession>["data"]
>;

export default function ManagementSessionBoundary({
  scope,
  children,
}: {
  scope: string;
  children: (session: ManagementSession) => ReactNode;
}) {
  const session = useManagementSession();
  return session.data ? (
    <Fragment key={`${scope}:${session.data.sessionId}:${session.data.orgId}`}>
      {children(session.data)}
    </Fragment>
  ) : (
    <div className="bw-bootstrap">
      <Feedback
        loading={session.loading}
        error={session.error}
        retry={() => void session.reload().catch(() => {})}
      />
    </div>
  );
}
