// ไฟล์: src/app/manifest.ts
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EasyCafe POS",
    short_name: "EasyCafe",
    description: "ระบบ POS จัดการร้านค้า",
    start_url: "/pos",
    display: "standalone", // สำคัญ: ทำให้เปิดแบบเต็มจอเหมือนแอป
    background_color: "#0F172A", // สีกรมท่า (Dark Mode)
    theme_color: "#0F172A",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
