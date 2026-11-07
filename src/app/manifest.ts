import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sistema Disciplinar CPM",
    short_name: "Disciplina CPM",
    description: "Acompanhamento disciplinar dos Colégios da Polícia Militar.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b1b31",
    theme_color: "#0b1b31",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icone-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icone-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
