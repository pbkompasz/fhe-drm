import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import "./App.css";

function App() {
  return (
    <Stack style={{ textAlign: "start" }}>
      <Typography variant="h1">Welcome,</Typography>
      <Typography variant="body1">
        This is a demo DRM application to showcase the power and utility of
        fully homomorphic encryption. Our implementation describes two ownership
        scenarios, when a new record is created:
      </Typography>
      <ol>
        <li>
          An asset e.g. video file, document can be linked to a new or existing
          NFT. This NFT represents ownership of the underlying asset.
        </li>
        <li>
          In the second scenario an asset linked to a new or existing
          collection. Every NFT in this collection represents ownership of the
          asset and grants various roles and actions e.g. CRUD, sharing, etc.
        </li>
      </ol>
      <Typography variant="body1"></Typography>
    </Stack>
  );
}

export default App;
