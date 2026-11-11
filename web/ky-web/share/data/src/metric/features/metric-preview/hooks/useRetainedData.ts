import { useEffect, useState } from "react";

/** Keep successful data only while its query identity stays the same. */
export function useRetainedData<T>(key: string | null, data: T | undefined) {
  const [last, setLast] = useState({ key, data });
  useEffect(() => {
    if (key !== null)
      setLast((previous) =>
        data !== undefined || previous.key !== key ? { key, data } : previous,
      );
  }, [key, data]);
  return data ?? (key !== null && last.key === key ? last.data : undefined);
}
