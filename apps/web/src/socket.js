import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

// A single shared socket for the app's lifetime. autoConnect is left on;
// Socket.IO's built-in reconnection (exponential backoff, capped attempts
// off by default = infinite) is what actually gives us "recovers from a
// dropped wifi connection" behavior without any custom retry code.
export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
});
