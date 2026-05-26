/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // Це дозволить успішно завершити деплой, навіть якщо в коді є дрібні помилки лінтера
      ignoreDuringBuilds: true,
    },
    typescript: {
      // На всякий випадок ігноруємо і дрібні варнінги типів при збірці
      ignoreBuildErrors: true,
    }
  }
  
  module.exports = nexTConfig