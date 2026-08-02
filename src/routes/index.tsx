import { createFileRoute } from "@tanstack/react-router";
import { TvHome } from "@/components/tv/TvHome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inicio TV — Interfaz Apple TV en la web" },
      {
        name: "description",
        content:
          "Simulación web de la interfaz de una smart TV con diseño Apple: Top Shelf, apps y páginas favoritas, navegable con el teclado.",
      },
      { property: "og:title", content: "Inicio TV — Interfaz Apple TV en la web" },
      {
        property: "og:description",
        content: "Una app de smart TV con UI estilo Apple tvOS, navegable con las flechas del teclado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TvHome,
});
