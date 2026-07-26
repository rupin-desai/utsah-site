/** @type {import('next').NextConfig} */
const nextConfig = {
  // The legacy scripts are plain DOM code with side effects — double-invoking
  // effects in dev would run them twice.
  // Dev output must not share manifests with a concurrent production build.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  reactStrictMode: true,
};

export default nextConfig;
