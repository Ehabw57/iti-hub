import { useI18nHTMLAttributes } from "./hooks/useI18nHTMLAttributes.tsx";
import { AppRoutes } from "./routes";
import SocketDebugger from "./components/common/SocketDebugger";

function App() {
  useI18nHTMLAttributes();

  return (
    <>
      <AppRoutes />
      {import.meta.env.DEV && <SocketDebugger />}
    </>
  );
}

export default App;
