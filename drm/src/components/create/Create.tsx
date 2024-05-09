import Button from "@mui/material/Button";
import "./Create.scss";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import { useState } from "react";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Dropzone from "react-dropzone";

// TODO When creating the record check if a file already has the same hash
// TODO different private key per NFT

interface MetadataArray {
  [index: string]: string;
}

type Record =  {
  id: string,
  uri: string,
  collectionId: string,
  nftId: string,
}

export const Create = () => {
  const [ownershipType, setOwnershipType] = useState<"collection" | "nft">(
    "collection"
  );
  // Text File (txt):
  //   Title of the document
  //   Author
  //   Creation date
  //   Description
  //   Encryption key (encrypted)
  // Audio File (mp3):
  //   Title of the song
  //   Artist
  //   Album name
  //   Genre
  //   Encryption key (encrypted)
  // Video File (mp4):
  //   Title of the video
  //   Director
  //   Actors
  //   Release date
  //   Encryption key (encrypted)
  // Image File (jpg, png):
  //   Title of the image
  //   Photographer or creator
  //   Location or event
  //   Description
  //   Encryption key (encrypted)
  const [metadata, setMetadata] = useState<MetadataArray>({});
  const [error, setError] = useState("");
  const [showCreated, setShowCreated] = useState(true);
  const [record, setRecord] = useState<Record>({} as Record);
  const [file, setFile] = useState<File>();

  const createDefaultMetadata = (file: File) => {
    console.log(file);
    setMetadata({});
  };

  function timeout(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  const createRecord = async () => {
    try {
      if (!file) return;
      await timeout(5000);
      const newRecord = {} as Record;
      setRecord(newRecord);
      createDefaultMetadata(file);
      setShowCreated(true);
    } catch (e) {
      setError("Error creating record");
    }
  };

  return (
    <Stack direction="column" className="form" gap={2} alignItems="center">
      <Typography color="warning">{error}</Typography>
      {!showCreated ? (
        <>
          <Typography variant="h1" alignSelf="flex-start">
            Create New Record
          </Typography>
          <TextField label="Url" variant="outlined"></TextField>
          <Dropzone
            multiple={false}
            onDrop={(acceptedFiles) => setFile(acceptedFiles[0])}
          >
            {({ getRootProps, getInputProps }) => (
              <section className="form__file">
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <p>Drag 'n' drop some files here, or click to select files</p>
                </div>
              </section>
            )}
          </Dropzone>
          <Typography variant="h2" alignSelf="flex-start">
            Owner Collection/NFT
          </Typography>
          <RadioGroup
            row
            aria-labelledby="demo-row-radio-buttons-group-label"
            name="row-radio-buttons-group"
          >
            <FormControlLabel
              checked={ownershipType === "collection"}
              onChange={() => setOwnershipType("collection")}
              value="collection"
              control={<Radio />}
              label="Collection"
            />
            <FormControlLabel
              value="nft"
              checked={ownershipType === "nft"}
              onChange={() => setOwnershipType("nft")}
              control={<Radio />}
              label="Single NFT"
            />
          </RadioGroup>
          <Typography className="form__explanation">
            {ownershipType === "collection"
              ? "If a collection address is added, users who have access to an NFT in the collection have access to the file. You can further customize roles and actions e.g. copy-able."
              : "Only the holder of this single NFT has access."}
          </Typography>
          <RadioGroup
            style={{ width: "100%" }}
            aria-labelledby="demo-row-radio-buttons-group-label"
            name="row-radio-buttons-group"
          >
            <Stack direction="row">
              <FormControlLabel
                checked={ownershipType === "collection"}
                onChange={() => setOwnershipType("collection")}
                value="collection"
                control={<Radio />}
                label="Link file to an existing NFT or collection"
              />
              <TextField></TextField>
            </Stack>
            <FormControlLabel
              value="nft"
              checked={ownershipType === "nft"}
              onChange={() => setOwnershipType("nft")}
              control={<Radio />}
              label="Create new NFT or collection"
            />
          </RadioGroup>

          <Divider />
          <Typography alignSelf="flex-start" variant="h2">
            Metadata
          </Typography>
          <Stack alignItems="flex-end">
            <Stack direction="row">
              <TextField></TextField>
              <TextField></TextField>
            </Stack>
            <Button>Add field</Button>
          </Stack>
          <Divider />
          <Typography alignSelf="flex-start" variant="h2">
            Storage Provider
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">
              Primary Storage
            </InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              // value={age}
              label="Primary Storage"
              // onChange={handleChange}
            >
              <MenuItem value="ipfs">IPFS</MenuItem>
              <MenuItem value="file-coin">FileCoin</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">
              Secondary Storage
            </InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              // value={age}
              label="Primary Storage"
              // onChange={handleChange}
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="ipfs">IPFS</MenuItem>
              <MenuItem value="file-coin">FileCoin</MenuItem>
            </Select>
          </FormControl>
          <Button onClick={() => createRecord()} variant="contained">
            Create
          </Button>
        </>
      ) : (
        <>
          <Typography variant="h1">{metadata["name"] ?? "filename"}</Typography>
          <Typography>
            {ownershipType === "collection"
              ? "This record is available to NFT owners in collection: "
              : "File available to the owner of the following NFT: "}
            {record.id ?? "0x43124321432432random4312432id"}
          </Typography>
          {ownershipType === "collection" && (
            <Typography>
              You can manage roles, actions, etc. by clicking{" "}
              <a href={`/collection/${record.collectionId}`}>here</a>
            </Typography>
          )}

          <Typography>
            Shareable link:
            <a
              target="_blank"
              href={record.uri ?? "https://asd.com/1234asd1234"}
            >
              {record.uri ?? "https://asd.com/1234asd1234"}
            </a>
          </Typography>
        </>
      )}
    </Stack>
  );
};

export default Create;
