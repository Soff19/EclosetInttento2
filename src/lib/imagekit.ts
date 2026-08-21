import ImageKit from "imagekit";

export function getImageKit() {
  return new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
  });
};

export function getBackgroundRemovedUrl(url: string) {
  const imageUrl = new URL(url);
  imageUrl.searchParams.set("tr", "e-bgremove");
  return imageUrl.toString();
}

