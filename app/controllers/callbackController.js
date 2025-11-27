const { getModel } = require('../models');

class CallbackController {
  async handleCallback(req, res) {
    try {
      const model = getModel();

      const callbackData = {
        route: req.params.path || req.path,
        method: req.method,
        headers: req.headers,
        query: req.query,
        body: req.body,
        ip: req.ip || req.connection.remoteAddress
      };

      const savedCallback = await model.saveCallback(callbackData);

      res.status(200).json({
        success: true,
        message: 'Callback received and logged',
        id: savedCallback.id
      });
    } catch (error) {
      console.error('Error handling callback:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing callback',
        error: error.message
      });
    }
  }

  async getCallbacks(req, res) {
    try {
      const model = getModel();
      const { route, date, limit, offset } = req.query;

      const filters = {
        route,
        date,
        limit: limit ? parseInt(limit) : 100,
        offset: offset ? parseInt(offset) : 0
      };

      const result = await model.getCallbacks(filters);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error getting callbacks:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving callbacks',
        error: error.message
      });
    }
  }

  async getCallbackById(req, res) {
    try {
      const model = getModel();
      const { id } = req.params;
      const { date } = req.query;

      const callback = await model.getCallbackById(id, date);

      if (!callback) {
        return res.status(404).json({
          success: false,
          message: 'Callback not found'
        });
      }

      res.status(200).json({
        success: true,
        data: callback
      });
    } catch (error) {
      console.error('Error getting callback:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving callback',
        error: error.message
      });
    }
  }

  async deleteCallback(req, res) {
    try {
      const model = getModel();
      const { id } = req.params;
      const { date } = req.query;

      const deleted = await model.deleteCallback(id, date);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Callback not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Callback deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting callback:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting callback',
        error: error.message
      });
    }
  }
}

module.exports = new CallbackController();
