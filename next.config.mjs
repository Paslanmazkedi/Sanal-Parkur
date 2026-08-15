/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/uretim', destination: '/', permanent: false },
      { source: '/production-orders', destination: '/iot-entegrasyon/uretim-emirleri', permanent: false },
      { source: '/iot-entegrasyon', destination: '/iot-entegrasyon/uretim-emirleri', permanent: false },
      { source: '/iot-entegrasyon/operator-paneli', destination: '/station', permanent: false },
      { source: '/iot-entegrasyon/loglar', destination: '/logs', permanent: false },
    ];
  },
};

export default nextConfig;
