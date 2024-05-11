import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Collection from "./components/collection/Collection";
import Create from "./components/create/Create";
import Record from "./components/record/Record";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/create",
    element: <Create />,
  },
  {
    path: "/collection/:id?",
    element: <Collection></Collection>,
  },
  {
    path: "/record/:id?",
    element: <Record></Record>,
  },
]);
