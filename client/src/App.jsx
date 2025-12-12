import { createBrowserRouter } from "react-router-dom";
import { RouterProvider } from "react-router-dom";
import Messages from "./pages/Messages.jsx";
import Layout from "./layout/layout.jsx";
import Home from "./pages/Home.jsx";
import { useIntlayer, useLocale} from "react-intlayer";
import { useI18nHTMLAttributes } from "./hooks/useI18nHTMLAttributes.tsx";


function App() {
  const content = useIntlayer("app");
  useI18nHTMLAttributes();
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: "messages", element: <Messages /> },
      ],
    },
  ]);

  return (
    <>
      <RouterProvider router={router}></RouterProvider>
    </>
  );
}

export default App;
