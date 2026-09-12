import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ChooseTools",
    short_name: "ChooseTools",
    description: "Free browser-based file tools. Your files never leave your device.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f7",
    theme_color: "#0e8a6c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
