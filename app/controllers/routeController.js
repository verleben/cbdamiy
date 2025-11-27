const { getModel } = require('../models');

class RouteController {
  async createRoute(req, res) {
    try {
      const model = getModel();
      const { path, name, description } = req.body;

      if (!path || !name) {
        return res.status(400).json({
          success: false,
          message: 'Path and name are required'
        });
      }

      // Validate path format
      if (!path.startsWith('/')) {
        return res.status(400).json({
          success: false,
          message: 'Path must start with /'
        });
      }

      const route = await model.saveRoute({ path, name, description });

      res.status(201).json({
        success: true,
        message: 'Route created successfully',
        data: route
      });
    } catch (error) {
      console.error('Error creating route:', error);

      // Handle duplicate path error
      if (error.message && error.message.includes('UNIQUE')) {
        return res.status(409).json({
          success: false,
          message: 'Route path already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating route',
        error: error.message
      });
    }
  }

  async getRoutes(req, res) {
    try {
      const model = getModel();
      const routes = await model.getRoutes();

      res.status(200).json({
        success: true,
        data: routes
      });
    } catch (error) {
      console.error('Error getting routes:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving routes',
        error: error.message
      });
    }
  }

  async updateRoute(req, res) {
    try {
      const model = getModel();
      const { id } = req.params;
      const { path, name, description } = req.body;

      const updatedRoute = await model.updateRoute(id, { path, name, description });

      if (!updatedRoute) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Route updated successfully',
        data: updatedRoute
      });
    } catch (error) {
      console.error('Error updating route:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating route',
        error: error.message
      });
    }
  }

  async deleteRoute(req, res) {
    try {
      const model = getModel();
      const { id } = req.params;

      const deleted = await model.deleteRoute(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Route deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting route:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting route',
        error: error.message
      });
    }
  }
}

module.exports = new RouteController();
