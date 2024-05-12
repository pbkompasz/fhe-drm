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

const decryptFile = async (file: File, seed: number) => {
  const fileArrayBuffer = await readFileAsArrayBuffer(file);
  const key = await importKey(seed);
  const iv = await generateIV(seed);
  const encryptedData = await window.crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    key,
    fileArrayBuffer
  );
  const blob = new Blob([encryptedData]);
  return new File([blob], file.name);
};

export { encryptFile, decryptFile };
