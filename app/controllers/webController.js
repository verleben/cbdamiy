const { getModel } = require('../models');
const moment = require('moment-timezone');
const config = require('../config');

class WebController {
  async dashboard(req, res) {
    try {
      const model = getModel();

      // Get routes and recent callbacks
      const routes = await model.getRoutes();
      const recentCallbacks = await model.getCallbacks({ limit: 10 });

      res.render('dashboard', {
        routes,
        recentCallbacks: recentCallbacks.data,
        timezone: config.timezone,
        moment
      });
    } catch (error) {
      console.error('Error rendering dashboard:', error);
      res.status(500).send('Error loading dashboard');
    }
  }

  async viewCallbacks(req, res) {
    try {
      const model = getModel();
      const { route, date, page = 1 } = req.query;

      const limit = 50;
      const offset = (page - 1) * limit;

      const filters = {
        route,
        date,
        limit,
        offset
      };

      const result = await model.getCallbacks(filters);
      const routes = await model.getRoutes();

      // Get available dates for local storage
      let availableDates = [];
      if (config.db.connection === 'local' && model.getCallbackDates) {
        availableDates = await model.getCallbackDates();
      }

      const totalPages = Math.ceil(result.total / limit);

      res.render('callbacks', {
        callbacks: result.data,
        routes,
        availableDates,
        filters: { route, date, page: parseInt(page) },
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          total: result.total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        timezone: config.timezone,
        moment
      });
    } catch (error) {
      console.error('Error viewing callbacks:', error);
      res.status(500).send('Error loading callbacks');
    }
  }

  async viewCallbackDetail(req, res) {
    try {
      const model = getModel();
      const { id } = req.params;

      const callback = await model.getCallbackById(id);

      if (!callback) {
        return res.status(404).send('Callback not found');
      }

      res.render('callback-detail', {
        callback,
        timezone: config.timezone,
        moment
      });
    } catch (error) {
      console.error('Error viewing callback detail:', error);
      res.status(500).send('Error loading callback detail');
    }
  }

  async manageRoutes(req, res) {
    try {
      const model = getModel();
      const routes = await model.getRoutes();

      res.render('routes', {
        routes,
        timezone: config.timezone,
        moment
      });
    } catch (error) {
      console.error('Error managing routes:', error);
      res.status(500).send('Error loading routes');
    }
  }
}

module.exports = new WebController();
