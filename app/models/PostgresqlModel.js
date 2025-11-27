const { Pool } = require('pg');
const moment = require('moment-timezone');
const BaseModel = require('./BaseModel');
const config = require('../config');

class PostgresqlModel extends BaseModel {
  constructor() {
    super();
    this.timezone = config.timezone;
    this.pool = null;
  }

  async init() {
    this.pool = new Pool({
      host: config.db.host,
      port: config.db.port || 5432,
      user: config.db.username,
      password: config.db.password,
      database: config.db.database,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Create tables
    const client = await this.pool.connect();

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS callbacks (
          id VARCHAR(255) PRIMARY KEY,
          timestamp TIMESTAMP NOT NULL,
          route VARCHAR(500) NOT NULL,
          method VARCHAR(10) NOT NULL,
          headers JSONB,
          query JSONB,
          body JSONB,
          ip VARCHAR(45),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_callbacks_timestamp ON callbacks(timestamp)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_callbacks_route ON callbacks(route)
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS routes (
          id VARCHAR(255) PRIMARY KEY,
          path VARCHAR(500) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP
        )
      `);
    } finally {
      client.release();
    }
  }

  async saveCallback(data) {
    const callback = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: moment().tz(this.timezone).toISOString(),
      route: data.route,
      method: data.method,
      headers: data.headers || {},
      query: data.query || {},
      body: data.body || {},
      ip: data.ip
    };

    await this.pool.query(
      'INSERT INTO callbacks (id, timestamp, route, method, headers, query, body, ip) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [callback.id, callback.timestamp, callback.route, callback.method, callback.headers, callback.query, callback.body, callback.ip]
    );

    return callback;
  }

  async getCallbacks(filters = {}) {
    const { route, limit = 100, offset = 0, startDate, endDate } = filters;

    let query = 'SELECT * FROM callbacks WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (route) {
      query += ` AND route = $${paramIndex++}`;
      params.push(route);
    }

    if (startDate) {
      query += ` AND timestamp >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ' ORDER BY timestamp DESC';

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = await this.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await this.pool.query(query, params);

    return { data: result.rows, total, limit, offset };
  }

  async getCallbackById(id) {
    const result = await this.pool.query('SELECT * FROM callbacks WHERE id = $1', [id]);

    if (result.rows.length === 0) return null;

    return result.rows[0];
  }

  async deleteCallback(id) {
    const result = await this.pool.query('DELETE FROM callbacks WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  async saveRoute(route) {
    const newRoute = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      path: route.path,
      name: route.name,
      description: route.description || '',
      created_at: moment().tz(this.timezone).toISOString()
    };

    await this.pool.query(
      'INSERT INTO routes (id, path, name, description, created_at) VALUES ($1, $2, $3, $4, $5)',
      [newRoute.id, newRoute.path, newRoute.name, newRoute.description, newRoute.created_at]
    );

    return newRoute;
  }

  async getRoutes() {
    const result = await this.pool.query('SELECT * FROM routes ORDER BY created_at DESC');
    return result.rows;
  }

  async deleteRoute(id) {
    const result = await this.pool.query('DELETE FROM routes WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  async updateRoute(id, data) {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (data.path) {
      updates.push(`path = $${paramIndex++}`);
      params.push(data.path);
    }

    if (data.name) {
      updates.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }

    updates.push(`updated_at = $${paramIndex++}`);
    params.push(moment().tz(this.timezone).toISOString());

    params.push(id);

    const result = await this.pool.query(
      `UPDATE routes SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    );

    if (result.rowCount === 0) return null;

    const getResult = await this.pool.query('SELECT * FROM routes WHERE id = $1', [id]);
    return getResult.rows[0];
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

module.exports = PostgresqlModel;
