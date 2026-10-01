import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server only: lets a phone on the same Wi-Fi open the preview at the
  // Mac's address (2026-09-26). Update it if the Mac's address changes
  // (10.0.0.29 added 2026-10-01, another Wi-Fi network).
  allowedDevOrigins: ["192.168.1.200", "10.0.0.29"],
};

export default nextConfig;
