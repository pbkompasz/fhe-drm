import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./router.tsx";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { amber, grey } from "@mui/material/colors";

import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: amber,
    divider: amber[200],
    background: {
      default: grey[900],
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Stack style={{ minHeight: "100vh" }} alignItems="flex-start">
        <Stack direction="row" gap={10} alignSelf="center">
          <a href="/">Home</a>
          <a href="/record">View created records</a>
          {/* <a href="/collection">Manage collections</a> */}
          <a href="/create">Create new record</a>
        </Stack>
        <Divider />
        <RouterProvider router={router} />
      </Stack>
    </ThemeProvider>
  </React.StrictMode>
);
