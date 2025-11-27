const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();

  // Priority order: look for local network IP first, then localhost
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  // Fallback to localhost if no network interface found
  return '127.0.0.1';
}

module.exports = { getLocalIPAddress };
