import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EnviroEdge AI",
    short_name: "EnviroEdge",
    description: "Real-time environmental and risk monitoring dashboard",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    orientation: "landscape",
  };
}
