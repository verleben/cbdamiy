require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 3000,
  timezone: process.env.TZ || 'UTC',

  // Database Configuration
  db: {
    connection: process.env.DB_CONNECTION || 'local',
    pathname: process.env.DB_PATHNAME || '.db',
    host: process.env.DB_HOSTNAME || 'localhost',
    port: process.env.DB_PORT || null,
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'cbdamiy'
  },

  // Security Configuration
  whitelist: {
    ips: process.env.WHILTELIST_IP
      ? process.env.WHILTELIST_IP.split(',').map(ip => ip.trim())
      : ['127.0.0.1', '::1', 'localhost']
  }
};

module.exports = config;
