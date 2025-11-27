const fs = require('fs').promises;
const path = require('path');
const moment = require('moment-timezone');
const BaseModel = require('./BaseModel');
const config = require('../config');

class LocalModel extends BaseModel {
  constructor() {
    super();
    this.dataDir = path.resolve(config.db.pathname);
    this.timezone = config.timezone;
  }

  async init() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });

      // Create routes file if it doesn't exist
      const routesFile = path.join(this.dataDir, 'routes.json');
      try {
        await fs.access(routesFile);
      } catch {
        await fs.writeFile(routesFile, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error('Error initializing local storage:', error);
      throw error;
    }
  }

  _getTodayFileName() {
    return moment().tz(this.timezone).format('YYYY-MM-DD') + '.json';
  }

  async _getTodayFilePath() {
    const fileName = this._getTodayFileName();
    return path.join(this.dataDir, 'callbacks', fileName);
  }

  async _ensureCallbacksDir() {
    const callbacksDir = path.join(this.dataDir, 'callbacks');
    await fs.mkdir(callbacksDir, { recursive: true });
  }

  async _readTodayCallbacks() {
    await this._ensureCallbacksDir();
    const filePath = await this._getTodayFilePath();

    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async _writeTodayCallbacks(callbacks) {
    await this._ensureCallbacksDir();
    const filePath = await this._getTodayFilePath();
    await fs.writeFile(filePath, JSON.stringify(callbacks, null, 2));
  }

  async saveCallback(data) {
    const callbacks = await this._readTodayCallbacks();

    const callback = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: moment().tz(this.timezone).toISOString(),
      route: data.route,
      method: data.method,
      headers: data.headers,
      query: data.query,
      body: data.body,
      ip: data.ip
    };

    callbacks.push(callback);
    await this._writeTodayCallbacks(callbacks);

    return callback;
  }

  async getCallbacks(filters = {}) {
    const { date, route, limit = 100, offset = 0 } = filters;

    let callbacks = [];

    if (date) {
      // Read specific date file
      const fileName = moment(date).tz(this.timezone).format('YYYY-MM-DD') + '.json';
      const filePath = path.join(this.dataDir, 'callbacks', fileName);

      try {
        const data = await fs.readFile(filePath, 'utf8');
        callbacks = JSON.parse(data);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    } else {
      // Read today's file
      callbacks = await this._readTodayCallbacks();
    }

    // Filter by route if specified
    if (route) {
      callbacks = callbacks.filter(cb => cb.route === route);
    }

    // Sort by timestamp descending
    callbacks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const total = callbacks.length;
    const paginatedCallbacks = callbacks.slice(offset, offset + limit);

    return {
      data: paginatedCallbacks,
      total,
      limit,
      offset
    };
  }

  async getCallbackById(id) {
    const callbacks = await this._readTodayCallbacks();
    return callbacks.find(cb => cb.id === id) || null;
  }

  async deleteCallback(id) {
    const callbacks = await this._readTodayCallbacks();
    const index = callbacks.findIndex(cb => cb.id === id);

    if (index === -1) return false;

    callbacks.splice(index, 1);
    await this._writeTodayCallbacks(callbacks);

    return true;
  }

  async saveRoute(route) {
    const routes = await this.getRoutes();

    const newRoute = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      path: route.path,
      name: route.name,
      description: route.description || '',
      createdAt: moment().tz(this.timezone).toISOString()
    };

    routes.push(newRoute);

    const routesFile = path.join(this.dataDir, 'routes.json');
    await fs.writeFile(routesFile, JSON.stringify(routes, null, 2));

    return newRoute;
  }

  async getRoutes() {
    const routesFile = path.join(this.dataDir, 'routes.json');

    try {
      const data = await fs.readFile(routesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async deleteRoute(id) {
    const routes = await this.getRoutes();
    const index = routes.findIndex(r => r.id === id);

    if (index === -1) return false;

    routes.splice(index, 1);

    const routesFile = path.join(this.dataDir, 'routes.json');
    await fs.writeFile(routesFile, JSON.stringify(routes, null, 2));

    return true;
  }

  async updateRoute(id, data) {
    const routes = await this.getRoutes();
    const index = routes.findIndex(r => r.id === id);

    if (index === -1) return null;

    routes[index] = {
      ...routes[index],
      ...data,
      id: routes[index].id,
      updatedAt: moment().tz(this.timezone).toISOString()
    };

    const routesFile = path.join(this.dataDir, 'routes.json');
    await fs.writeFile(routesFile, JSON.stringify(routes, null, 2));

    return routes[index];
  }

  async getCallbackDates() {
    const callbacksDir = path.join(this.dataDir, 'callbacks');

    try {
      const files = await fs.readdir(callbacksDir);
      const dates = files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''))
        .sort()
        .reverse();

      return dates;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}

module.exports = LocalModel;
