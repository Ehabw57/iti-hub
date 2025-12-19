import { useI18nHTMLAttributes } from "./hooks/useI18nHTMLAttributes.tsx";
import { AppRoutes } from "./routes";

function App() {
  useI18nHTMLAttributes();

  return <AppRoutes />;
}

export default App;
