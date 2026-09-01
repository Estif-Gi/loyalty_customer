import type { GeoLocationCoordinates, GeolocationError } from "../types";

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 12000, // 12 seconds
  maximumAge: 10000, // 10 seconds cache maximum
};

/**
 * Promisified browser geolocation helper with typed error handling.
 */
export function getCurrentCoordinates(
  options: GeolocationOptions = DEFAULT_OPTIONS
): Promise<GeoLocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      const err: GeolocationError = {
        code: "NOT_SUPPORTED",
        message: "Geolocation is not supported by your browser.",
      };
      return reject(err);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let code: GeolocationError["code"] = "POSITION_UNAVAILABLE";
        let message = "Unable to retrieve your location.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            code = "PERMISSION_DENIED";
            message = "Location permission was denied. Please allow location access to order.";
            break;
          case error.POSITION_UNAVAILABLE:
            code = "POSITION_UNAVAILABLE";
            message = "Location information is unavailable. Please check your GPS settings.";
            break;
          case error.TIMEOUT:
            code = "TIMEOUT";
            message = "Location request timed out. Please try again.";
            break;
        }

        const geoErr: GeolocationError = { code, message };
        reject(geoErr);
      },
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 12000,
        maximumAge: options.maximumAge ?? 10000,
      }
    );
  });
}
