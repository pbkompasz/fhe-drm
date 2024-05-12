/* eslint-disable @typescript-eslint/ban-ts-comment */
import Button from "@mui/material/Button";
import "./Create.scss";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import FormControlLabel from "@mui/material/FormControlLabel";
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
import { getDefaultMetadata } from "../../util/create";
import { decryptFile, encryptFile } from "../../util/encrypt";
import { createCollection, mintNFT, updateCollection } from "../../util/mint";

// TODO When creating the record check if a file already has the same hash
// TODO Order
// init -> when showing the initial form
// requested -> After hitting 'Create', call `checkProviderSetup`
//    if no account -> show setup Dialog
//    after setup completed
//    encryption (if requested)
//    upload, which returns the URI
//    mint NFT (for now)

export interface Metadata {
  name: string;
  value: string | number;
  encrypted?: boolean;
}

type UploadMethod = "pinata" | "infura" | "web3.storage";

const STORAGE_PROVIDERS = [
  {
    name: "pinata",
    label: "IPFS w/ Pinata",
    implemented: false,
  },
  {
    name: "infura",
    label: "IPFS w/ Infura",
    implemented: false,
  },
  {
    name: "web3.storage",
    label: "FileCoin w/ web3.storage",
  },
];

export const Create = () => {
  const [status, setStatus] = useState<"init" | "requested" | "completed">(
    "init"
  );
  const [error, setError] = useState("");

  const [encryptedUpload, setEncryptedUpload] = useState(false);
  const [file, setFile] = useState<File>();
  const [assignToCollection, setAssignToCollection] = useState(false);
  const [collectionId, setCollectionId] = useState("");

  const [metadata, setMetadata] = useState<Metadata[]>([
    {
      name: "Your field",
      value: 1,
      encrypted: false,
    },
  ]);

  const [primaryMethod, setPrimaryMethod] =
    useState<UploadMethod>("web3.storage");
  const [secondaryMethod, setSecondaryMethod] = useState<UploadMethod | "none">(
    "none"
  );

  const createDefaultMetadata = async (file: File) => {
    const newMetadata = await getDefaultMetadata(file);

    newMetadata.push({
      name: "Your field",
      value: 1,
      encrypted: true,
    });
    setMetadata(newMetadata);
  };

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

  const [showSetup, setShowSetup] = useState(false);

  const setupWeb3Storage = async () => {
    const client = await create();
    const account = await client.login(emailAddress);
    const space = await client.createSpace("drm");
    await space.save();
    await account.provision(space.did());
  };

  const [currentAction, setCurrentAction] = useState<
    | "encrypting"
    | "uploading"
    | "minting"
    | "updating_collection"
    | "creating_collection"
    | "none"
  >("none");
  const [uri, setUri] = useState("");
  const [recordId, setRecordId] = useState<string | number>("");

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
        return resp.toString();
    }
  };

  const createRecord = async () => {
    try {
      if (!file) throw new Error("No file selected");
      setStatus("requested");
      const client = await create();

      if (!Object.keys(client.accounts()).length) {
        setShowSetup(true);
        return;
      }

      const seed = Math.floor(Math.random() * 1000);
      let f = file;
      if (encryptedUpload) {
        setCurrentAction("encrypting");
        // TODO Random number
        f = await encryptFile(file, seed);
        setFile(f);
      }
      setCurrentAction("uploading");
      const did = await upload(primaryMethod, f);
      setUri(`https://${did}.ipfs.w3s.link`);
      if (secondaryMethod !== "none") await upload(secondaryMethod, file);

      setCurrentAction("minting");
      const id = await mintNFT(uri, seed, metadata);
      setRecordId(id);

      if (assignToCollection) {
        if (collectionId) {
          setCurrentAction("updating_collection");
          await createCollection(collectionId, id);
        } else {
          setCurrentAction("creating_collection");

          await updateCollection(collectionId, id);
        }
      }
      setStatus("completed");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.log(e);
      setStatus("init");
      setError("Error creating record. " + e.message);
      setTimeout(() => {
        setError("");
      }, 5000);
    }
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

  const [emailAddress, setEmailAddress] = useState<`${string}@${string}`>(
    "your_email@gmail.com"
  );

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
            <Typography>
              <CircularProgress />
              Head to your inbox and click the validation link
            </Typography>
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
            label="Encrypt file before creating new record"
            control={
              <Checkbox
                checked={encryptedUpload}
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
            Collection
          </Typography>
          <Stack direction="row">
            <FormControlLabel
              label="Assign NFT to a new or existing collection"
              disabled
              control={
                <Checkbox
                  checked={assignToCollection}
                  onChange={(e) => setAssignToCollection(e.target.checked)}
                  inputProps={{ "aria-label": "controlled" }}
                />
              }
            />
            <TextField
              label="Enter existing collection name"
              disabled={!assignToCollection}
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
            ></TextField>
          </Stack>
          <Typography className="form__explanation">
            If a collection address is added, users who have access to an NFT in
            the collection have access to the file. You can further customize
            roles and actions e.g. copy-able.
          </Typography>

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
                  label="Value (numeric or boolean values only)"
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
              {STORAGE_PROVIDERS.filter(
                (provider) => provider.implemented !== false
              ).map((provider) => (
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
              {STORAGE_PROVIDERS.filter(
                (provider) =>
                  provider.implemented !== false &&
                  provider.name !== primaryMethod
              ).map((provider) => (
                <MenuItem key={provider.name} value={provider.name}>
                  {provider.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            onClick={() => createRecord()}
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
          {currentAction !== "none" && (
            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              style={{ width: "100%" }}
            >
              <CircularProgress />
              <Typography>{currentAction}</Typography>
            </Stack>
          )}
        </>
      )}

      {/* Shows the file, the NFT id and document URI */}
      {status === "completed" && (
        <>
          <Typography variant="h1">
            {metadata.find((field) => field.name === "Name")?.value ??
              "Success"}
          </Typography>

          {assignToCollection && (
            <Typography>
              You can manage roles, actions, etc. by clicking{" "}
              <a href={`/collection/${collectionId}`}>here</a>
            </Typography>
          )}

          <Typography>
            Your file is uploaded to:
            <a target="_blank" href={uri}>
              {uri}
            </a>
          </Typography>
          <Typography>
            You can view it &nbsp;
            <a target="_blank" href={`/record/${recordId}`}>
              here
            </a>
          </Typography>
        </>
      )}
    </Stack>
  );
};

export default Create;
