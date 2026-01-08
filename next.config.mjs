/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

// Ensure Next.js uses this project as the workspace root to avoid lockfile warnings
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nextConfig = {
	outputFileTracingRoot: __dirname,
};

export default nextConfig;
