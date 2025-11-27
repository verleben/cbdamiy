require("dotenv").config();

const express = require("express");
const http = require("http");
const path = require("path");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const config = require("./app/config");
const { getModel } = require("./app/models");
const ipWhitelist = require("./app/middleware/ipWhitelist");
const { getLocalIPAddress } = require("./app/utils/network");

// Controllers
const callbackController = require("./app/controllers/callbackController");
const routeController = require("./app/controllers/routeController");
const webController = require("./app/controllers/webController");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "app/views"));

// Middleware to inject hostname and port into all views
app.use((req, res, next) => {
  res.locals.hostname = getLocalIPAddress();
  res.locals.port = config.port;
  next();
});

// Custom middleware to make layout work with EJS
app.use((req, res, next) => {
  const render = res.render;
  res.render = function(view, options, callback) {
    const self = this;
    options = options || {};

    // Merge res.locals with options
    options = Object.assign({}, res.locals, options);

    // Render the view
    app.render(view, options, function(err, html) {
      if (err) return callback ? callback(err) : next(err);

      // Render layout with the view content
      options.body = html;
      app.render('layout', options, function(err, layoutHtml) {
        if (err) return callback ? callback(err) : next(err);

        if (callback) {
          callback(null, layoutHtml);
        } else {
          self.send(layoutHtml);
        }
      });
    });
  };
  next();
});

// Initialize database
const model = getModel();
model.init().then(() => {
  console.log(`Database initialized (${config.db.connection})`);
}).catch(err => {
  console.error("Error initializing database:", err);
  process.exit(1);
});

// Web Routes (with IP whitelist)
app.get("/", ipWhitelist, webController.dashboard);
app.get("/callbacks", ipWhitelist, webController.viewCallbacks);
app.get("/callbacks/:id", ipWhitelist, webController.viewCallbackDetail);
app.get("/routes", ipWhitelist, webController.manageRoutes);

// API Routes - Route Management (with IP whitelist)
app.post("/api/routes", ipWhitelist, routeController.createRoute);
app.get("/api/routes", ipWhitelist, routeController.getRoutes);
app.put("/api/routes/:id", ipWhitelist, routeController.updateRoute);
app.delete("/api/routes/:id", ipWhitelist, routeController.deleteRoute);

// API Routes - Callback Management (with IP whitelist)
app.get("/api/callbacks", ipWhitelist, callbackController.getCallbacks);
app.get("/api/callbacks/:id", ipWhitelist, callbackController.getCallbackById);
app.delete("/api/callbacks/:id", ipWhitelist, callbackController.deleteCallback);

// Dynamic callback routes - Load routes and create handlers
async function setupDynamicRoutes() {
  try {
    const routes = await model.getRoutes();

    routes.forEach(route => {
      const fullPath = `/callback${route.path}`;

      // Handle all HTTP methods
      app.all(fullPath, callbackController.handleCallback.bind(callbackController));

      console.log(`Registered callback route: ${fullPath}`);
    });
  } catch (err) {
    console.error("Error setting up dynamic routes:", err);
  }
}

// Setup dynamic routes on startup
setupDynamicRoutes();

// Fallback callback route for any unregistered callback paths
app.all("/callback/*", callbackController.handleCallback.bind(callbackController));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource was not found"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message
  });
});

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`CB Dummy - Callback Manager`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Database: ${config.db.connection}`);
  console.log(`Timezone: ${config.timezone}`);
  console.log(`Whitelisted IPs: ${config.whitelist.ips.join(", ")}`);
  console.log(`\nWeb Interface: http://localhost:${PORT}`);
  console.log(`Callback endpoint: http://localhost:${PORT}/callback/{your-path}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");

  server.close(() => {
    console.log("HTTP server closed");
  });

  // Close database connections
  if (model.close) {
    await model.close();
    console.log("Database connection closed");
  }

  process.exit(0);
});
