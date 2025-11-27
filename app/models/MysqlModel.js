const mysql = require('mysql2/promise');
const moment = require('moment-timezone');
const BaseModel = require('./BaseModel');
const config = require('../config');

class MysqlModel extends BaseModel {
  constructor() {
    super();
    this.timezone = config.timezone;
    this.pool = null;
  }

  async init() {
    this.pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port || 3306,
      user: config.db.username,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Create tables
    const connection = await this.pool.getConnection();

    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS callbacks (
          id VARCHAR(255) PRIMARY KEY,
          timestamp DATETIME NOT NULL,
          route VARCHAR(500) NOT NULL,
          method VARCHAR(10) NOT NULL,
          headers JSON,
          query JSON,
          body JSON,
          ip VARCHAR(45),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_timestamp (timestamp),
          INDEX idx_route (route)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS routes (
          id VARCHAR(255) PRIMARY KEY,
          path VARCHAR(500) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    } finally {
      connection.release();
    }
  }

  async saveCallback(data) {
    const callback = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: moment().tz(this.timezone).format('YYYY-MM-DD HH:mm:ss'),
      route: data.route,
      method: data.method,
      headers: JSON.stringify(data.headers || {}),
      query: JSON.stringify(data.query || {}),
      body: JSON.stringify(data.body || {}),
      ip: data.ip
    };

    await this.pool.query(
      'INSERT INTO callbacks (id, timestamp, route, method, headers, query, body, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [callback.id, callback.timestamp, callback.route, callback.method, callback.headers, callback.query, callback.body, callback.ip]
    );

    return {
      ...callback,
      headers: JSON.parse(callback.headers),
      query: JSON.parse(callback.query),
      body: JSON.parse(callback.body)
    };
  }

  async getCallbacks(filters = {}) {
    const { route, limit = 100, offset = 0, startDate, endDate } = filters;

    let query = 'SELECT * FROM callbacks WHERE 1=1';
    const params = [];

    if (route) {
      query += ' AND route = ?';
      params.push(route);
    }

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY timestamp DESC';

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const [countResult] = await this.pool.query(countQuery, params);
    const total = countResult[0].count;

    // Get paginated results
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await this.pool.query(query, params);

    const data = rows.map(row => ({
      ...row,
      headers: typeof row.headers === 'string' ? JSON.parse(row.headers) : row.headers,
      query: typeof row.query === 'string' ? JSON.parse(row.query) : row.query,
      body: typeof row.body === 'string' ? JSON.parse(row.body) : row.body
    }));

    return { data, total, limit, offset };
  }

  async getCallbackById(id) {
    const [rows] = await this.pool.query('SELECT * FROM callbacks WHERE id = ?', [id]);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...row,
      headers: typeof row.headers === 'string' ? JSON.parse(row.headers) : row.headers,
      query: typeof row.query === 'string' ? JSON.parse(row.query) : row.query,
      body: typeof row.body === 'string' ? JSON.parse(row.body) : row.body
    };
  }

  async deleteCallback(id) {
    const [result] = await this.pool.query('DELETE FROM callbacks WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async saveRoute(route) {
    const newRoute = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      path: route.path,
      name: route.name,
      description: route.description || '',
      created_at: moment().tz(this.timezone).format('YYYY-MM-DD HH:mm:ss')
    };

    await this.pool.query(
      'INSERT INTO routes (id, path, name, description, created_at) VALUES (?, ?, ?, ?, ?)',
      [newRoute.id, newRoute.path, newRoute.name, newRoute.description, newRoute.created_at]
    );

    return newRoute;
  }

  async getRoutes() {
    const [rows] = await this.pool.query('SELECT * FROM routes ORDER BY created_at DESC');
    return rows;
  }

  async deleteRoute(id) {
    const [result] = await this.pool.query('DELETE FROM routes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  async updateRoute(id, data) {
    const updates = [];
    const params = [];

    if (data.path) {
      updates.push('path = ?');
      params.push(data.path);
    }

    if (data.name) {
      updates.push('name = ?');
      params.push(data.name);
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    updates.push('updated_at = ?');
    params.push(moment().tz(this.timezone).format('YYYY-MM-DD HH:mm:ss'));

    params.push(id);

    const [result] = await this.pool.query(
      `UPDATE routes SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) return null;

    const [rows] = await this.pool.query('SELECT * FROM routes WHERE id = ?', [id]);
    return rows[0];
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

module.exports = MysqlModel;
