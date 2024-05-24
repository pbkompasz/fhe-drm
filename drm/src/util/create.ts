import { Metadata } from "../components/create/Create";

export function getImageMetadata(
  file: File
): Promise<{ height: number; width: number }> {
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

export function getVideoMetadata(
  file: File
): Promise<{ height: number; width: number; duration: number }> {
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

export function getDocumentMetadata(
  file: File
): Promise<{ lineCount: number }> {
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

export const getDefaultMetadata = async (file: File) => {
  const extension = file.name.split(".")[1];
  const isVideo = ["mpg", "mp2", "mpeg", "mpe", "mpv", "mp4"];
  const isImage = ["gif", "jpg", "jpeg", "png"];
  const isDocument = ["txt", "json"];
  // name, filesize, etc.
  // resolution and length for video
  const newMetadata: Metadata[] = [
    {
      name: "Size",
      value: file.size,
      encrypted: true,
    },
    {
      name: "Created",
      value: +new Date(),
      encrypted: false,
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
  return newMetadata;
};
