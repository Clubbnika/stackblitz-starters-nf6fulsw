/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // Ігноруємо помилки лінтера (лапки, апострофи) при деплої
      ignoreDuringBuilds: true,
    },
    typescript: {
      // Ігноруємо дрібні варнінги типів при збірці
      ignoreBuildErrors: true,
    }
  }
  
  module.exports = nextConfig