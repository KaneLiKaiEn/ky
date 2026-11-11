import { useCallback, useEffect, useRef, useState } from "react";
import { getOrgList } from "@/api/org";
import type { OrgRow } from "@/types/org";

type OrganizationListLoadedHandler = (
  rows: OrgRow[],
  preferredId: number | undefined,
  isCurrent: () => boolean,
) => void | Promise<void>;

/** 管理机构列表请求及乱序保护；选择和切换确认仍由页面处理。 */
export function useOrganizationList(onLoaded: OrganizationListLoadedHandler) {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const requestId = useRef(0);
  const mounted = useRef(false);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current++;
    };
  }, []);

  const loadOrgs = useCallback(async (preferredId?: number) => {
    const id = ++requestId.current;
    const isCurrent = () => mounted.current && id === requestId.current;
    setLoading(true);
    setLoadFailed(false);
    try {
      const res = await getOrgList({ column_list: "*" });
      if (!isCurrent()) return;
      const rows = (res.org_list ?? [])
        .filter((row) => Number(row.org_id) > 0)
        .map((row) => ({ ...row, org_id: Number(row.org_id) }));
      setOrgs(rows);
      await onLoadedRef.current(rows, preferredId, isCurrent);
    } catch {
      if (isCurrent()) setLoadFailed(true);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, []);

  return { orgs, setOrgs, loading, loadFailed, loadOrgs };
}
