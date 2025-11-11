import { createBrowserRouter } from "react-router-dom";
import { RouterProvider } from "react-router-dom";
// import { useEffect } from "react";
import Messages from "./pages/Messages.jsx";
import Layout from "./layout/layout.jsx";
import Home from "./pages/Home.jsx";
import { useIntlayer, useLocale} from "react-intlayer";
import { Locales } from "intlayer";
import { useI18nHTMLAttributes } from "./hooks/useI18nHTMLAttributes.tsx";


function App() {
  const { setLocale } = useLocale();
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
      <h1>{content.title}</h1>
      <h1>{content.welcome}</h1>
      <RouterProvider router={router}></RouterProvider>
      <button onClick={()=>setLocale(Locales.ARABIC)}>AR</button>
      <button onClick={()=>setLocale(Locales.ENGLISH)}>EN</button>
    </>
  );
}

export default App;
