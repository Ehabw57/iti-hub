import { create } from 'zustand';

/**
 * Socket store - NO persistence
 * Socket connections cannot be persisted across page reloads
 */
export const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,
  reconnecting: false,

  setSocket: (socket) => {
    set({ socket });
  },

  setConnected: (connected) => {
    set({ connected });
  },

  setReconnecting: (reconnecting) => {
    set({ reconnecting });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({
      socket: null,
      connected: false,
      reconnecting: false,
    });
  },
}));

export default useSocketStore;
