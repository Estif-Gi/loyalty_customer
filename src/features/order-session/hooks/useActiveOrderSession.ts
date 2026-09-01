import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { orderSessionApi } from "../api/orderSessionApi";
import type { OrderSession } from "../types";

export function useActiveOrderSession() {
  const { isAuthenticated, isInitialized } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<OrderSession | null>({
    queryKey: queryKeys.activeOrderSession(),
    queryFn: orderSessionApi.getCurrentSession,
    enabled: isInitialized && isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: (query) => {
      // If we have an active session, poll every 60s to detect server-side expiry or cancellation
      return query.state.data ? 1000 * 60 : false;
    },
  });

  const session = query.data || null;

  // Check if session has expired locally
  const isExpired = session
    ? new Date(session.expiresAt).getTime() <= Date.now()
    : false;

  const invalidateSession = () => {
    queryClient.setQueryData(queryKeys.activeOrderSession(), null);
    queryClient.invalidateQueries({ queryKey: queryKeys.activeOrderSession() });
  };

  return {
    session: isExpired ? null : session,
    rawSession: session,
    isExpired,
    hasActiveSession: Boolean(session && !isExpired),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidateSession,
  };
}
