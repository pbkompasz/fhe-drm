import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getNFTs, getNFT } from "../../util/mint";
import { decryptFile } from "../../util/encrypt";

const RecordDetails = ({ id }: { id: string }) => {
  const [uri, setUri] = useState();
  const [originalSeed, setOriginalSeed] = useState<number>();
  const [seed, setSeed] = useState<number>();

  useEffect(() => {
    const setup = async () => {
      console.log(id);
      const { seed, originalSeed, uri } = await getNFT(+id);
      setSeed(Number(seed));
      setOriginalSeed(originalSeed);
      setUri(uri);

      // TODO Fix decrypt
      try {
        const cryptedFile = await fetch(uri);
        const blob = new Blob([await cryptedFile.blob()]);
        // const file = new File([blob], "download.png");
        // const decryptedFile = await decryptFile(file, Number(seed));
        const url = window.URL.createObjectURL(blob);
        // const urlDecrypted = window.URL.createObjectURL(decryptedFile);
        const a = document.getElementById("download_crypted");
        // const aDecrypted = document.getElementById("download_decrypted");
        if (a) {
          a.href = url;
          a.download = "download.png";
        }
        // if (aDecrypted) {
        //   aDecrypted.href = urlDecrypted;
        //   aDecrypted.download = "download.png";
        // }
      } catch (error) {
        console.log(error);
        console.log("No file");
      }
    };
    setup().catch(console.error);
  }, [id]);
  return (
    <Stack alignItems="flex-start" style={{ textAlign: "start" }}>
      <Typography variant="h1">Record</Typography>
      <Typography variant="body1">URI of the encrypted file: {uri}</Typography>
      <Typography variant="body1">
        The encryption seed encrypted: {originalSeed}, <br /> after decryption: {seed}
      </Typography>
      <a id="download_cypted">Download crypted file</a>
      <a id="download_decypted">Download decrypted file</a>
    </Stack>
  );
};

const RecordExplorer = () => {
  const [nfts, setNfts] = useState(0);

  useEffect(() => {
    const setup = async () => {
      const resp = await getNFTs();
      console.log(resp);
      setNfts(Number(resp));
    };
    setup().catch(console.error);
  }, []);
  return (
    <Stack alignItems="flex-start" style={{ textAlign: "start" }}>
      <Typography variant="h1">Your records ({nfts})</Typography>
    </Stack>
  );
};

const Record = () => {
  const { id } = useParams();

  return id ? <RecordDetails id={id} /> : <RecordExplorer />;
};

export default Record;
