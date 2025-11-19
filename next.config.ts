import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Ignorar módulos nativos (.node) do SSH2 no lado do servidor
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'ssh2': 'commonjs ssh2',
        'node-ssh': 'commonjs node-ssh',
      });
    }
    
    // Ignorar arquivos .node (binários nativos)
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });
    
    return config;
  },
  
  // Outras configurações
  experimental: {
    serverComponentsExternalPackages: ['ssh2', 'node-ssh'],
  },
};

export default nextConfig;
