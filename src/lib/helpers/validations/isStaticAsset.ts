const staticAssetExtensions = [
    ".css",
    ".js",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".webp",
  ];
  
  export function isStaticAsset(path: string) {
    const extension = new URL(path, "http://example.com").pathname
      .split("/")
      .pop()
      ?.split(".")
      .pop();
    return staticAssetExtensions.includes(`.${extension}`);
  }
  