/**
 * Re-exports the singleton customer Socket client from the centralized realtime module.
 * Maintained for backwards-compatibility across existing imports.
 */
export {
  getSocketOrigin,
  getSocket,
  isSocketConnected,
  connectSocket,
  disconnectSocket,
  refreshUserProfile,
  initSocketConnection,
} from "@/realtime/socket";
