import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/auth.js';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export default function SocketProvider({ children }) {
  const token = useAuthStore((s) => s.token);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3030';
    const s = io(url, {
      autoConnect: !!token,
      auth: token ? { token } : undefined,
    });
    setSocket(s);
    return () => {
      s.close();
    };
  }, [token]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
