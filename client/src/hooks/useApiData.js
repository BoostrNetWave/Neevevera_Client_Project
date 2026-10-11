/**
 * useApiData.js — Generic data-fetching hook for all public GET calls.
 *
 * Handles three required states:  loading / data / error
 *
 * Race-condition safety:
 *   When params change while a request is in-flight (e.g. rapid filter
 *   clicks on Projects), the earlier request is aborted so it can never
 *   overwrite a newer, more relevant response with stale data.
 *
 *   This requires that fetchFn actually forwards the signal to the API
 *   call. content.api.js functions all accept { signal } for this reason.
 *
 * Usage:
 *   const { data, items, loading, error, isEmpty, refetch } = useApiData(
 *     (signal) => getProjects({ category, region, page }, { signal }),
 *     [category, region, page]          // <- deps that trigger re-fetch
 *   );
 *
 * Return shape:
 *   data    — raw response from the API (e.g. { success, items, total })
 *   items   — convenience: data.items if it exists, else data wrapped in []
 *   loading — true while request is in flight
 *   error   — error message string, or null
 *   isEmpty — true when loaded successfully but no data was returned
 *   refetch — manually re-run the fetch (e.g. after a form submit)
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useApiData(fetchFn, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // One AbortController per in-flight request.
  const controllerRef  = useRef(null);
  // Monotonically increasing counter — only the latest request may
  // commit its result to state.
  const requestIdRef   = useRef(0);

  const execute = useCallback(async () => {
    // Cancel the previous request if it is still running.
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    const thisId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(controller.signal);

      // Guard: even if the request was not aborted but a newer one has
      // already started, discard this stale result.
      if (thisId === requestIdRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      // AbortError / CanceledError (axios) are expected when a newer
      // request supersedes this one — not a user-visible error.
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      if (thisId === requestIdRef.current) {
        setError(
          err.response?.data?.error ||
          err.response?.data?.message ||
          'Something went wrong loading this content.'
        );
        setLoading(false);
      }
    }
  // deps spread into useCallback so ESLint exhaustive-deps is satisfied
  // without forcing callers to memoize their fetchFn manually.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
    // Cleanup: abort if the component unmounts mid-request.
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  // Normalise the response into a consistent items array regardless of
  // whether the API returned { items: [...] }, { data: {...} }, or a
  // plain array.
  const raw     = data?.items ?? data?.data ?? data;
  const items   = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
  const isEmpty = !loading && !error && items.length === 0;

  return { data, items, loading, error, isEmpty, refetch: execute };
}
