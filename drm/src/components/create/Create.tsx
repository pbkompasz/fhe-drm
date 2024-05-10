/* eslint-disable @typescript-eslint/ban-ts-comment */
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
import Checkbox from "@mui/material/Checkbox";
import { create } from "@web3-storage/w3up-client";
import Alert from "@mui/material/Alert";
import Fade from "@mui/material/Fade";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogContentText from "@mui/material/DialogContentText";
import CircularProgress from "@mui/material/CircularProgress";
import * as crypto from "crypto";

// TODO When creating the record check if a file already has the same hash
// TODO different private key per NFT
// TODO Order
// init -> when showing the initial form
// requested -> After hitting 'Create', call `checkProviderSetup`
//    if no account -> show setup Dialog
//    after setup completed
//    encryption (if requested)
//    upload, which returns the URI
//    mint NFT (for now)

interface Metadata {
  name: string;
  value: string | number;
  encrypted?: boolean;
}

type Record = {
  id: string;
  uri: string;
  collectionId: string;
  nftId: string;
};

const STORAGE_PROVIDERS = [
  {
    name: "pinata",
    label: "IPFS w/ Pinata",
  },
  {
    name: "infura",
    label: "IPFS w/ Infura",
  },
  {
    name: "web3.storage",
    label: "FileCoin w/ web3.storage",
  },
];

type UploadMethod = "pinata" | "infura" | "web3.storage";

export const Create = () => {
  const [ownershipType, setOwnershipType] = useState<"collection" | "nft">(
    "nft"
  );
  const [metadata, setMetadata] = useState<Metadata[]>([
    {
      name: "Name",
      value: "asd",
      encrypted: false,
    },
  ]);
  const updateMetadata = (
    index: number,
    field: "name" | "value" | "encrypted",
    value: string | boolean
  ) => {
    setMetadata((prevMetadata) => {
      const updatedMetadata = [...prevMetadata];
      // @ts-ignore
      updatedMetadata[index][field] = value;
      return updatedMetadata;
    });
  };

  const [showSetup, setShowSetup] = useState(true);
  const [error, setError] = useState("");
  const [record, setRecord] = useState<Record>({} as Record);
  const [file, setFile] = useState<File>();
  const [encryptedUplaod, setEncryptedUpload] = useState(false);

  const [primaryMethod, setPrimaryMethod] =
    useState<UploadMethod>("web3.storage");
  const [secondaryMethod, setSecondaryMethod] = useState<UploadMethod | "none">(
    "none"
  );

  const [status, setStatus] = useState<
    "init" | "in_progress" | "requested" | "completed"
  >("init");

  const upload = async (method: UploadMethod, file: File) => {
    let client;
    let resp;
    switch (method) {
      case "infura":
        break;
      case "pinata":
        break;
      case "web3.storage":
      default:
        client = await create();
        resp = await client.uploadFile(file);
        console.log(resp);
        break;
    }
  };

  function timeout(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const initMint = async () => {
    setStatus("in_progress");
    const client = await create();
    if (!Object.keys(client.accounts()).length) {
      setShowSetup(true);
    } else {
      await createRecord();
    }
  };

  const createRecord = async () => {
    try {
      if (!file) throw new Error("No file selected");
      setStatus("requested");
      if (encryptedUplaod) encryptFile(file, "asd");
      await upload(primaryMethod, file);
      if (secondaryMethod !== "none") await upload(secondaryMethod, file);
      await timeout(5000);
      const newRecord = {} as Record;
      setRecord(newRecord);
      setStatus("completed");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.log(e);
      setError("Error creating record. " + e.message);
      setTimeout(() => {
        setError("");
      }, 5000);
    }
  };

  function readFileAsBytes(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (event) {
        const result = event.target?.result;
        if (result) {
          const bytes = new Uint8Array(result as ArrayBuffer);
          resolve(bytes);
        } else {
          reject("empty");
        }
      };
      reader.onerror = function (event) {
        reject(event.target?.error);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  const encryptFile = async (file: File, key: string) => {
    const bytes = await readFileAsBytes(file);
    const cipher = crypto.createCipher("aes-256-cbc", key);
    const encryptedBytes = Buffer.concat([
      cipher.update(bytes),
      cipher.final(),
    ]);
    const blob = new Blob([encryptedBytes], { type: "mp4" });
    const encryptedFile = new File([blob], "asd", { type: "mp4" });
    setFile(encryptedFile);
  };

  function getImageMetadata(file: File) {
    return new Promise((resolve) => {
      const fr = new FileReader();

      fr.onload = function () {
        const img = new Image();

        img.onload = function () {
          console.log(img.height);
          const height = img.height;
          const width = img.width;
          resolve({ height, width });
        };

        img.src = String(fr.result);
      };

      fr.readAsDataURL(file);
    });
  }

  function getVideoMetadata(file: File) {
    return new Promise((resolve) => {
      // create the video element
      const video = document.createElement("video");

      // place a listener on it
      video.addEventListener(
        "loadedmetadata",
        function () {
          // retrieve dimensions
          const height = this.videoHeight;
          const width = this.videoWidth;
          const duration = this.duration;

          // send back result
          resolve({ height, width, duration });
        },
        false
      );

      // start download meta-datas
      video.src = URL.createObjectURL(file);
    });
  }

  function getDocumentMetadata(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (event) {
        const text = event.target?.result;
        if (text) {
          const lineCount = (String(text).match(/\n/g) || []).length + 1;
          resolve({ lineCount });
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  const createDefaultMetadata = async (file: File) => {
    const extension = file.name.split(".")[1];
    const isVideo = ["mpg", "mp2", "mpeg", "mpe", "mpv", "mp4"];
    const isImage = ["gif", "jpg", "jpeg", "png"];
    const isDocument = ["txt", "json"];
    // name, filesize, etc.
    // resolution and length for video
    const newMetadata: Metadata[] = [
      {
        name: "Name",
        value: file.name.split(".")[0],
        encrypted: true,
      },
      {
        name: "Size",
        value: file.size,
        encrypted: true,
      },
    ];

    if (isVideo.includes(extension)) {
      const { width, height, duration } = await getVideoMetadata(file);

      newMetadata.push({
        name: "Width",
        value: width,
        encrypted: true,
      });
      newMetadata.push({
        name: "Height",
        value: height,
        encrypted: true,
      });
      newMetadata.push({
        name: "Duration",
        value: duration,
        encrypted: true,
      });
    }

    if (isImage.includes(extension)) {
      const { width, height } = await getImageMetadata(file);
      console.log(width);
      newMetadata.push({
        name: "Width",
        value: width,
        encrypted: true,
      });
      newMetadata.push({
        name: "Height",
        value: height,
        encrypted: true,
      });
    }

    if (isDocument.includes(extension)) {
      const { lineCount } = await getDocumentMetadata(file);
      newMetadata.push({
        name: "Number of lines",
        value: lineCount,
        encrypted: true,
      });
    }
    setMetadata(newMetadata);
  };

  const onFileUpload = (file: File) => {
    setFile(file);
    createDefaultMetadata(file);
  };

  const addMetadata = () => {
    setMetadata((prevState) => [
      ...prevState,
      {
        name: "",
        value: "",
        encrypted: false,
      },
    ]);
  };

  const [emailAddress, setEmailAddress] =
    useState<`${string}@${string}`>("demo@demo.com");
  const [setupStatus, setSetupStatus] = useState<
    "init" | "in_progress" | "completed"
  >("init");

  const setupWeb3Storage = async () => {
    const client = await create();
    setSetupStatus("in_progress");
    const account = await client.login(emailAddress);
    setSetupStatus("completed");
    const space = await client.createSpace("drm");
    await space.save();
    await account.provision(space.did());
  };

  const getSetupContent = (method: UploadMethod) => {
    switch (method) {
      case "web3.storage":
        return (
          <>
            <TextField
              id="outlined-basic"
              variant="outlined"
              value={emailAddress}
              onChange={(e) =>
                setEmailAddress(e.target.value as `${string}@${string}`)
              }
              label="Email"
            ></TextField>
            <Button onClick={() => setupWeb3Storage()}>Validate</Button>
            {setupStatus === "in_progress" && (
              <Typography>
                <CircularProgress />
                Head to your inbox and click the validation link
              </Typography>
            )}
          </>
        );

      default:
        break;
    }
  };

  return (
    <Stack direction="column" className="form" gap={2} alignItems="flex-start">
      <Fade in={!!error}>
        <Stack
          alignItems="center"
          justifyContent="center"
          style={{ position: "fixed", width: 1000 }}
        >
          <Alert severity="warning">{error}</Alert>
        </Stack>
      </Fade>
      {status === "init" && (
        <>
          <Typography variant="h1" alignSelf="flex-start">
            Create New Record
          </Typography>
          <FormControlLabel
            label="Encrypt file before minting"
            control={
              <Checkbox
                checked={encryptedUplaod}
                onChange={(e) => setEncryptedUpload(e.target.checked)}
                inputProps={{ "aria-label": "controlled" }}
              />
            }
          />
          <Dropzone
            multiple={false}
            onDrop={(acceptedFiles) => onFileUpload(acceptedFiles[0])}
          >
            {({ getRootProps, getInputProps }) => (
              <section className="form__file">
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <p>
                    {file
                      ? file.name
                      : "Drag 'n' drop some files here, or click to select files"}
                  </p>
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
              disabled
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
          {ownershipType === "collection" && (
            <RadioGroup
              style={{ width: "100%" }}
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
            >
              <Stack direction="row">
                <FormControlLabel
                  // checked={ownershipType === "collection"}
                  onChange={() => setOwnershipType("collection")}
                  value="collection"
                  control={<Radio />}
                  label="Link file to an existing collection"
                />
                {/* TODO Change it a select */}
                {/* TODO Fetch collections where owner */}
                <TextField></TextField>
              </Stack>
              <FormControlLabel
                value="nft"
                // checked={option2}
                // onChange={() => setOwnershipType("nft")}
                control={<Radio />}
                label="Create a new collection"
              />
            </RadioGroup>
          )}

          <Divider />
          <Typography alignSelf="flex-start" variant="h2">
            Metadata
          </Typography>
          <Stack
            direction="column"
            alignItems="flex-start"
            style={{ width: "100%" }}
            gap={2}
          >
            {metadata.map((entry, index) => (
              <Stack key={index} direction="row" gap={2}>
                <TextField
                  id="outlined-basic"
                  label="Name"
                  value={entry.name}
                  onChange={(e) =>
                    updateMetadata(index, "name", e.target.value)
                  }
                  variant="outlined"
                />
                <TextField
                  id="outlined-basic"
                  label="Value"
                  value={entry.value}
                  onChange={(e) =>
                    updateMetadata(index, "value", e.target.value)
                  }
                  variant="outlined"
                />
                <FormControlLabel
                  label="Leave field unencrypted"
                  control={
                    <Checkbox
                      checked={!entry.encrypted}
                      onChange={(e) =>
                        updateMetadata(index, "encrypted", !e.target.checked)
                      }
                      inputProps={{ "aria-label": "controlled" }}
                    />
                  }
                />
              </Stack>
            ))}
            <Stack direction="row-reverse" style={{ width: "100%" }}>
              <Button onClick={() => addMetadata()}>Add field</Button>
            </Stack>
          </Stack>
          <Divider />
          <Typography alignSelf="flex-start" variant="h2">
            Storage Provider
          </Typography>
          <FormControl fullWidth>
            <InputLabel
              id="demo-simple-select-label"
              style={{ color: "white" }}
            >
              Primary Storage
            </InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={primaryMethod}
              label="Primary Storage"
              onChange={(e) => setPrimaryMethod(e.target.value as UploadMethod)}
            >
              {STORAGE_PROVIDERS.map((provider) => (
                <MenuItem key={provider.name} value={provider.name}>
                  {provider.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel
              id="demo-simple-select-label"
              style={{ color: "white" }}
            >
              Secondary Storage
            </InputLabel>
            <Select
              color="primary"
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={secondaryMethod}
              label="Secondary Storage"
              onChange={(e) =>
                setSecondaryMethod(e.target.value as UploadMethod)
              }
            >
              <MenuItem value="none">None</MenuItem>
              {STORAGE_PROVIDERS.map((provider) => (
                <MenuItem key={provider.name} value={provider.name}>
                  {provider.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            onClick={() => initMint()}
            variant="contained"
            style={{ marginLeft: "auto", width: "6rem" }}
          >
            Create
          </Button>
        </>
      )}

      {/* Storage provider setup, waiting for file uploads, NFT/collection creation, etc. */}
      {status === "requested" && (
        <>
          <Dialog
            open={showSetup}
            onClose={() => setShowSetup(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              Storage Provider Setup
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                {getSetupContent(primaryMethod)}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowSetup(false)} autoFocus>
                Done
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* Shows the file, the NFT id and document URI */}
      {status === "completed" && (
        <>
          <Typography variant="h1">
            {metadata.find((field) => field.name === "Name")?.value ??
              "filename"}
          </Typography>
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
