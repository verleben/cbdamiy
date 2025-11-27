const config = require('../config');

function ipWhitelist(req, res, next) {
  const clientIp = req.ip || req.connection.remoteAddress;
  const whitelistedIps = config.whitelist.ips;

  // Normalize IPv6 localhost to IPv4
  const normalizedIp = clientIp === '::1' ? '127.0.0.1' : clientIp.replace(/^::ffff:/, '');

  const isWhitelisted = whitelistedIps.some(ip => {
    // Support for localhost variations
    if (ip === 'localhost' && (normalizedIp === '127.0.0.1' || normalizedIp === '::1')) {
      return true;
    }
    return normalizedIp === ip || clientIp === ip;
  });

  if (!isWhitelisted) {
    console.warn(`Blocked request from non-whitelisted IP: ${clientIp}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Your IP address is not whitelisted'
    });
  }

  next();
}

module.exports = ipWhitelist;
