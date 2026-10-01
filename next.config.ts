import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server only: lets a phone on the same Wi-Fi open the preview at the
  // Mac's address (2026-09-26). Update it if the Mac's address changes.
  allowedDevOrigins: ["192.168.1.200"],
};

export default nextConfig;
