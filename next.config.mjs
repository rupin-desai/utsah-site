/** @type {import('next').NextConfig} */
const nextConfig = {
  // The legacy scripts are plain DOM code with side effects — double-invoking
  // effects in dev would run them twice.
  reactStrictMode: true,
};

export default nextConfig;
