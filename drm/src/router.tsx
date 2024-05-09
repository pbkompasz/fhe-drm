import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Collection from "./components/collection/Collection";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/collection/:id",
    element: <Collection></Collection>
  },
]);
