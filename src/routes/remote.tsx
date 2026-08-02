import { createFileRoute } from "@tanstack/react-router";
import { Remote } from "@/components/tv/Remote";

export const Route = createFileRoute("/remote")({
  head: () => ({
    meta: [
      { title: "Control remoto móvil — Smart TV estilo Apple" },
      {
        name: "description",
        content:
          "Control remoto para el móvil con trackpad táctil y botones físicos simulados al girar el teléfono.",
      },
      { property: "og:title", content: "Control remoto móvil — Smart TV estilo Apple" },
      {
        property: "og:description",
        content: "Trackpad táctil en vertical y botones tipo mando de smart TV en horizontal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Remote,
});
