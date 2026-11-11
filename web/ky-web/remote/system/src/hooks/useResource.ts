import { useResource as useSharedResource } from "comm/resource";
import { errorText } from "../utils/result";

/** Preserve the system editor's background refresh and optimistic mutation contract. */
export function useResource<T>(key: string | null, load: () => Promise<T>) {
  const { data, error, loading, refresh, mutate } = useSharedResource(
    key,
    load,
    {
      formatError: errorText,
    },
  );
  return { data, error, loading, reload: refresh, mutate };
}
