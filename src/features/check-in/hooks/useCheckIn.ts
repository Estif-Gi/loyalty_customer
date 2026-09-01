import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { ApiError, BACKEND_ERROR_CODES } from "@/lib/errors";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getCurrentCoordinates } from "../utils/geolocation";
import { checkInApi } from "../api/checkInApi";
import type {
  CheckInState,
  CheckInErrorDetails,
  GeolocationError,
} from "../types";

export function useCheckIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAuthenticated, isInitialized } = useAuth();

  const [state, setState] = useState<CheckInState>({ status: "idle" });
  const isExecutingRef = useRef(false);

  // Extract raw QR token from URL search params: ?t=<token>
  const searchParams = new URLSearchParams(location.search);
  const qrToken = searchParams.get("t")?.trim() || null;

  const mapError = useCallback((err: unknown): CheckInErrorDetails => {
    if ((err as GeolocationError)?.code) {
      const geoErr = err as GeolocationError;
      switch (geoErr.code) {
        case "PERMISSION_DENIED":
          return {
            reason: "location-denied",
            title: "Location Permission Required",
            message: "Your location is required to confirm that you are at this restaurant. Please enable location access in your browser settings and try again.",
            canRetry: true,
            rawError: err,
          };
        case "POSITION_UNAVAILABLE":
          return {
            reason: "location-unavailable",
            title: "Location Unavailable",
            message: "Unable to retrieve your device location. Please ensure GPS is enabled and try again.",
            canRetry: true,
            rawError: err,
          };
        case "TIMEOUT":
          return {
            reason: "location-timeout",
            title: "Location Request Timed Out",
            message: "Location check took too long. Please move to an open area or closer to a window and try again.",
            canRetry: true,
            rawError: err,
          };
        case "NOT_SUPPORTED":
          return {
            reason: "location-not-supported",
            title: "Geolocation Not Supported",
            message: "Your browser does not support geolocation. Please open this page in a modern mobile browser.",
            canRetry: false,
            rawError: err,
          };
      }
    }

    if (err instanceof ApiError) {
      switch (err.errorCode) {
        case BACKEND_ERROR_CODES.QR_CODE_NOT_FOUND:
          return {
            reason: "invalid-qr",
            title: "Invalid QR Code",
            message: "This QR code is not valid. Please scan the official QR code displayed on your table.",
            canRetry: false,
            rawError: err,
          };
        case BACKEND_ERROR_CODES.QR_CODE_REVOKED:
        case BACKEND_ERROR_CODES.QR_CODE_INACTIVE:
          return {
            reason: "revoked-qr",
            title: "Table QR Unavailable",
            message: "This table QR code is currently inactive or has been replaced. Please ask restaurant staff for assistance.",
            canRetry: false,
            rawError: err,
          };
        case BACKEND_ERROR_CODES.TABLE_INACTIVE:
          return {
            reason: "table-inactive",
            title: "Table Inactive",
            message: "Ordering is currently disabled for this table. Please ask staff for assistance.",
            canRetry: false,
            rawError: err,
          };
        case BACKEND_ERROR_CODES.RESTAURANT_ORDERING_DISABLED:
          return {
            reason: "ordering-disabled",
            title: "Ordering Disabled",
            message: "This restaurant is not accepting table orders at the moment. Please ask restaurant staff.",
            canRetry: false,
            rawError: err,
          };
        case BACKEND_ERROR_CODES.OUTSIDE_RESTAURANT_ORDERING_RADIUS:
          return {
            reason: "outside-geofence",
            title: "You're Too Far From This Restaurant",
            message: "Table ordering is only available while you are physically at the restaurant table.",
            canRetry: true,
            rawError: err,
          };
        case BACKEND_ERROR_CODES.LOCATION_ACCURACY_TOO_LOW:
        case BACKEND_ERROR_CODES.INVALID_CUSTOMER_COORDINATES:
          return {
            reason: "location-accuracy-low",
            title: "GPS Accuracy Too Low",
            message: "Your GPS accuracy could not verify your exact table presence. Please try opening Google Maps or Apple Maps briefly to improve accuracy, then retry.",
            canRetry: true,
            rawError: err,
          };
        case BACKEND_ERROR_CODES.ORDER_SESSION_CONCURRENCY_CONFLICT:
          return {
            reason: "concurrency-conflict",
            title: "Check-In Collision",
            message: "A concurrent session was established. Please tap retry to resume your session.",
            canRetry: true,
            rawError: err,
          };
        case BACKEND_ERROR_CODES.OFFLINE:
          return {
            reason: "offline",
            title: "You Are Offline",
            message: "An active internet connection is required to check in. Please reconnect and try again.",
            canRetry: true,
            rawError: err,
          };
        default:
          return {
            reason: "server-error",
            title: "Check-In Failed",
            message: err.message || "Failed to establish order session. Please ask restaurant staff for assistance.",
            canRetry: true,
            rawError: err,
          };
      }
    }

    return {
      reason: "server-error",
      title: "Check-In Error",
      message: (err as Error)?.message || "An unexpected error occurred during table check-in.",
      canRetry: true,
      rawError: err,
    };
  }, []);

  const proceedWithCheckIn = useCallback(async () => {
    if (!qrToken) {
      setState({
        status: "error",
        error: {
          reason: "missing-token",
          title: "Scan Your Table QR",
          message: "To start an order, scan the QR code located on your restaurant table.",
          canRetry: false,
        },
      });
      return;
    }

    if (!isAuthenticated) {
      setState({ status: "needs-auth" });
      return;
    }

    if (isExecutingRef.current) return;
    isExecutingRef.current = true;

    try {
      setState({ status: "validating" });

      // Step 1: Capture fresh device geolocation
      const locationCoords = await getCurrentCoordinates({
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5000,
      });

      // Step 2: Call backend to create/refresh active OrderSession
      const session = await checkInApi.createOrderSession({
        qrToken,
        location: locationCoords,
      });

      // Step 3: Populate TanStack Query cache with the active session
      queryClient.setQueryData(queryKeys.activeOrderSession(), session);
      queryClient.invalidateQueries({ queryKey: queryKeys.activeOrderSession() });

      setState({ status: "success", session });

      // Step 4: Clean URL & Navigate: Replace /order/start?t=... with /order/menu
      // This discards the raw QR token from URL history and memory
      navigate("/order/menu", { replace: true });
    } catch (err: unknown) {
      const errorDetails = mapError(err);
      setState({ status: "error", error: errorDetails });
    } finally {
      isExecutingRef.current = false;
    }
  }, [isAuthenticated, mapError, navigate, qrToken, queryClient]);

  // Initial evaluation when component mounts or auth hydrates
  useEffect(() => {
    if (!isInitialized) return;

    if (!qrToken) {
      setState({
        status: "error",
        error: {
          reason: "missing-token",
          title: "Scan Your Table QR",
          message: "To start an order, scan the QR code located on your restaurant table.",
          canRetry: false,
        },
      });
      return;
    }

    if (!isAuthenticated) {
      setState({ status: "needs-auth" });
      return;
    }

    // Authenticated with valid token -> prompt location confirmation
    setState({ status: "requesting-location" });
  }, [isInitialized, isAuthenticated, qrToken]);

  const redirectToLogin = useCallback(() => {
    // Save full current path with ?t=... to state so login returns right back to check-in
    navigate("/onboarding", {
      state: { from: { pathname: location.pathname, search: location.search } },
    });
  }, [location.pathname, location.search, navigate]);

  return {
    state,
    qrToken,
    proceedWithCheckIn,
    redirectToLogin,
    goHome: () => navigate("/home", { replace: true }),
  };
}
