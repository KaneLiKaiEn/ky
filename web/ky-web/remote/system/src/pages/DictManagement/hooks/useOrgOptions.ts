import { useCallback, useEffect, useMemo, useState } from "react";
import { useOrgOptions as useOrganizationData } from "@/hooks/useOrgOptions";
import { SYSTEM_ORG } from "../constants";
import { resolveOrgId } from "../utils";

/** Dictionary selection also supports the virtual system organization (zero). */
export function useOrgOptions() {
  const resource = useOrganizationData();
  const [selection, setSelection] = useState<{ sessionId: string | null; orgId?: number }>();
  const orgId = selection?.sessionId === resource.sessionId ? selection.orgId : undefined;
  useEffect(() => {
    if (!resource.data) return;
    setSelection((current) => {
      if (current?.sessionId === resource.sessionId && current.orgId != null) return current;
      return {
        sessionId: resource.sessionId,
        orgId: resolveOrgId(resource.data!.sessionOrgId ?? undefined, resource.data!.orgs),
      };
    });
  }, [resource.data, resource.sessionId]);
  const setOrgId = useCallback((id: number) => {
    setSelection({ sessionId: resource.sessionId, orgId: id });
  }, [resource.sessionId]);
  const options = useMemo(() => [SYSTEM_ORG, ...(resource.data?.orgs ?? [])], [resource.data]);
  return { ...resource, orgId, setOrgId, options };
}
