import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Força uso do webpack em vez do Turbopack para compatibilidade
  webpack: (config, { dev, isServer }) => {
    // Otimizações para produção
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      };
    }

    return config;
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Configuração de imagens (atualizada para Next.js 16)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "petshop.tech10cloud.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },

  // Experimental features (removido swcMinify depreciado)
  experimental: {
    optimizeCss: true,
  },

  // Configuração do Turbopack para evitar erros
  turbopack: {},
};

export default nextConfig;
