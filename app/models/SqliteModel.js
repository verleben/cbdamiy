const Database = require('better-sqlite3');
const path = require('path');
const moment = require('moment-timezone');
const BaseModel = require('./BaseModel');
const config = require('../config');

class SqliteModel extends BaseModel {
  constructor() {
    super();
    this.dbPath = path.resolve(config.db.pathname, 'cbdamiy.db');
    this.timezone = config.timezone;
    this.db = null;
  }

  async init() {
    this.db = new Database(this.dbPath);

    // Create callbacks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS callbacks (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        route TEXT NOT NULL,
        method TEXT NOT NULL,
        headers TEXT,
        query TEXT,
        body TEXT,
        ip TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create routes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS routes (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      )
    `);

    // Create indexes
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_callbacks_timestamp ON callbacks(timestamp)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_callbacks_route ON callbacks(route)`);
  }

  async saveCallback(data) {
    const callback = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: moment().tz(this.timezone).toISOString(),
      route: data.route,
      method: data.method,
      headers: JSON.stringify(data.headers || {}),
      query: JSON.stringify(data.query || {}),
      body: JSON.stringify(data.body || {}),
      ip: data.ip
    };

    const stmt = this.db.prepare(`
      INSERT INTO callbacks (id, timestamp, route, method, headers, query, body, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      callback.id,
      callback.timestamp,
      callback.route,
      callback.method,
      callback.headers,
      callback.query,
      callback.body,
      callback.ip
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
    const countStmt = this.db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count'));
    const { count: total } = countStmt.get(...params);

    // Get paginated results
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);

    const data = rows.map(row => ({
      ...row,
      headers: JSON.parse(row.headers),
      query: JSON.parse(row.query),
      body: JSON.parse(row.body)
    }));

    return { data, total, limit, offset };
  }

  async getCallbackById(id) {
    const stmt = this.db.prepare('SELECT * FROM callbacks WHERE id = ?');
    const row = stmt.get(id);

    if (!row) return null;

    return {
      ...row,
      headers: JSON.parse(row.headers),
      query: JSON.parse(row.query),
      body: JSON.parse(row.body)
    };
  }

  async deleteCallback(id) {
    const stmt = this.db.prepare('DELETE FROM callbacks WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async saveRoute(route) {
    const newRoute = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      path: route.path,
      name: route.name,
      description: route.description || '',
      created_at: moment().tz(this.timezone).toISOString()
    };

    const stmt = this.db.prepare(`
      INSERT INTO routes (id, path, name, description, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(newRoute.id, newRoute.path, newRoute.name, newRoute.description, newRoute.created_at);

    return newRoute;
  }

  async getRoutes() {
    const stmt = this.db.prepare('SELECT * FROM routes ORDER BY created_at DESC');
    return stmt.all();
  }

  async deleteRoute(id) {
    const stmt = this.db.prepare('DELETE FROM routes WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
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
    params.push(moment().tz(this.timezone).toISOString());

    params.push(id);

    const stmt = this.db.prepare(`
      UPDATE routes SET ${updates.join(', ')} WHERE id = ?
    `);

    const result = stmt.run(...params);

    if (result.changes === 0) return null;

    const getStmt = this.db.prepare('SELECT * FROM routes WHERE id = ?');
    return getStmt.get(id);
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = SqliteModel;
