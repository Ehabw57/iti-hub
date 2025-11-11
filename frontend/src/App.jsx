import { createBrowserRouter } from "react-router-dom";
import { RouterProvider } from "react-router-dom";
import Messages from "./pages/Messages.jsx";
import Layout from "./layout/layout";
import Home from "./pages/Home";

function App() {
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
