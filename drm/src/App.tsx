import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import "./App.css";

function App() {
  return (
    <Stack style={{ textAlign: "start" }}>
      <Typography variant="h1">Welcome,</Typography>
      <Typography variant="body1">
        This is a demo DRM application to showcase the power and utility of
        fully homomorphic encryption.
      </Typography>
      <Typography variant="body1">
        You can upload and generate an ownership NFT by clicking{" "}
        <a href="/create">here</a>
      </Typography>
      <Typography variant="body1">
        Link your new or existing NFT to a collection. Every NFT in this
        collection represents ownership of the asset and grants various roles
        and actions e.g. CRUD, sharing, etc.
      </Typography>
    </Stack>
  );
}

export default App;
