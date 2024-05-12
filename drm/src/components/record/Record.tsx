import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getNFTs, getNFT } from "../../util/mint";

const RecordDetails = ({ id }: { id: string }) => {
  const [uri, setUri] = useState();
  const [originalSeed, setOriginalSeed] = useState();
  const [seed, setSeed] = useState();

  useEffect(() => {
    const setup = async () => {
      // setNft(await getNFT(+id));
    };
    setup().catch(console.error);
  }, [id]);
  return (
    <Stack alignItems="flex-start" style={{ textAlign: "start" }}>
      <Typography variant="h1">Record</Typography>
      <Typography variant="body1">URI of the encrypted file: {uri}</Typography>
      <Typography variant="body1">The encryption seed encrypted: {originalSeed}, <br /> after: {seed}</Typography>
      <a>Download decrypted file</a>
    </Stack>
  );
};

const RecordExplorer = () => {
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    const setup = async () => {
      setNfts(await getNFTs());
    };
    setup().catch(console.error);
  }, []);
  return (
    <Stack alignItems="flex-start" style={{ textAlign: "start" }}>
      <Typography variant="h1">Your records ({nfts.length})</Typography>
    </Stack>
  );
};

const Record = () => {
  const { id } = useParams();

  return id ? <RecordDetails id={id} /> : <RecordExplorer />;
};

export default Record;
