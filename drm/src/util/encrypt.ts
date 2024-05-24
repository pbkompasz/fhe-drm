export async function importKey(seed: number) {
  const keyBuffer = new Uint8Array(32); // 256 bits (32 bytes)
  const seedView = new DataView(new ArrayBuffer(4)); // 4 bytes for the seed
  seedView.setUint32(0, seed);

  // Copy seed bytes to key buffer
  for (let i = 0; i < 4; i++) {
    keyBuffer[i] = seedView.getUint8(i);
  }

  return await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function generateIV(seed: number) {
  const ivBuffer = new Uint8Array(16); // 128 bits (16 bytes)
  const seedView = new DataView(new ArrayBuffer(4)); // 4 bytes for the seed
  seedView.setUint32(0, seed);

  // Copy seed bytes to IV buffer
  for (let i = 0; i < 4; i++) {
    ivBuffer[i] = seedView.getUint8(i);
  }

  return ivBuffer;
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function saveArrayBufferToFile(
  arrayBuffer: ArrayBuffer,
  filename: string
) {
  const blob = new Blob([arrayBuffer]);
  return new File([blob], "asd.txt");
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

const encryptFile = async (file: File, seed: number) => {
  const fileArrayBuffer = await readFileAsArrayBuffer(file);
  const key = await importKey(seed);
  const iv = await generateIV(seed);
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    fileArrayBuffer
  );
  const blob = new Blob([encryptedData]);
  return new File([blob], "file.name");
};

const _stringToArrayBuffer = (str: string) => {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
};

const _digestMessage = async (message: string) => {
  const data = _stringToArrayBuffer(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return hash;
};

const _arrayBufferToHexString = (buffer: ArrayBuffer) => {
  const byteArray = new Uint8Array(buffer);
  const hexCodes = [...byteArray].map((value) => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, "0");
    return paddedHexCode;
  });

  return hexCodes.join("");
};

export const getKeyFromPassphrase = async (passphrase: string) => {
  const key = await _digestMessage(passphrase);
  const keyHex = _arrayBufferToHexString(key);
  return keyHex;
};

export const getIvFromPassphrase = async (passphrase: string) => {
  const keyHex = await getKeyFromPassphrase(passphrase);
  const ivHex = keyHex.substring(0, 32);
  return ivHex;
};

const _arrayBufferFromHexString = (hexString: string) => {
  const bytes = Uint8Array.from(
    hexString.match(/.{1,2}/g).map((byte: any) => parseInt(byte, 16))
  );
  return bytes.buffer;
};

const decryptFile = async (file: File, seed: number) => {
  try {
    const fileArrayBuffer = await readFileAsArrayBuffer(file);
    console.log(fileArrayBuffer.byteLength);

    const keyHex = await getKeyFromPassphrase(String(seed));
    const ivHex = await getIvFromPassphrase(String(seed));

    const ivArrayBuffer = _arrayBufferFromHexString(ivHex);
    const keyArrayBuffer = _arrayBufferFromHexString(keyHex);

    const secretKey = await crypto.subtle.importKey(
      "raw",
      keyArrayBuffer,
      {
        name: "AES-CBC",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );

    const encryptedData = await window.crypto.subtle.decrypt(
      { name: "AES-CBC", iv: ivArrayBuffer },
      secretKey,
      fileArrayBuffer
    );
    const blob = new Blob([encryptedData]);
    return new File([blob], file.name);
  } catch (error) {
    console.log(error);
  }
};

export { encryptFile, decryptFile };
