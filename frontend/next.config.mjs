const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";

const nextConfig = {
  agentRules: false,
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};
export default nextConfig;
