import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  transpilePackages: ["three", "@sparkjsdev/spark"],
  webpack: (config) => {
    config.module.parser = {
      ...config.module.parser,
      javascript: {
        ...config.module.parser?.javascript,
        url: false,
      },
    }
    return config
  },
  serverExternalPackages: [
    "@aws-sdk/client-bedrock-runtime",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "firebase-admin",
  ],
  turbopack: {
    root: path.join(__dirname),
  },
}

export default nextConfig
