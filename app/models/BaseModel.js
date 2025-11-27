class BaseModel {
  constructor() {
    if (this.constructor === BaseModel) {
      throw new Error("BaseModel is an abstract class and cannot be instantiated directly");
    }
  }

  // Abstract methods that must be implemented by subclasses
  async init() {
    throw new Error("init() must be implemented");
  }

  async saveCallback(data) {
    throw new Error("saveCallback() must be implemented");
  }

  async getCallbacks(filters = {}) {
    throw new Error("getCallbacks() must be implemented");
  }

  async getCallbackById(id) {
    throw new Error("getCallbackById() must be implemented");
  }

  async deleteCallback(id) {
    throw new Error("deleteCallback() must be implemented");
  }

  async saveRoute(route) {
    throw new Error("saveRoute() must be implemented");
  }

  async getRoutes() {
    throw new Error("getRoutes() must be implemented");
  }

  async deleteRoute(id) {
    throw new Error("deleteRoute() must be implemented");
  }

  async updateRoute(id, data) {
    throw new Error("updateRoute() must be implemented");
  }
}

module.exports = BaseModel;
