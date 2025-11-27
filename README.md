# CB Dummy - Callback Manager

A lightweight Express.js-based callback manager for monitoring and logging HTTP callbacks from external services.

## Features

- **Multiple Database Support**: Local JSON (with daily rotation), SQLite, MySQL, PostgreSQL
- **Dynamic Callback Routes**: Create and manage callback endpoints through web UI
- **Web Interface**: Monitor and view callback logs in real-time
- **IP Whitelisting**: Security layer to restrict access
- **Timezone Support**: Configurable timezone for accurate timestamps
- **RESTful API**: Full API for programmatic access

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
```env
PORT=58592
TZ=Asia/Jakarta

# Database Configuration
DB_CONNECTION=local  # Options: local, sqlite, mysql, postgresql
DB_PATHNAME=".db"    # For local/sqlite storage

# For MySQL/PostgreSQL (uncomment if needed)
# DB_HOSTNAME=localhost
# DB_PORT=3306
# DB_USERNAME=root
# DB_PASSWORD=password
# DB_DATABASE=cbdamiy

# IP Whitelist (comma-separated)
WHILTELIST_IP=127.0.0.1,::1,localhost
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Accessing the Application

After starting the server, access:

- **Web Interface**: `http://localhost:58592`
- **Callback Endpoint**: `http://localhost:58592/callback/{your-path}`

## How It Works

### 1. Create Callback Routes

Navigate to "Manage Routes" in the web interface and create callback endpoints:

- **Path**: `/transaction-start`
- **Name**: Transaction Start
- **Description**: Called when transaction starts

This creates the endpoint: `http://localhost:58592/callback/transaction-start`

### 2. Receive Callbacks

External services can send callbacks to your registered endpoints:

```bash
# Example POST request
curl -X POST http://localhost:58592/callback/transaction-start \
  -H "Content-Type: application/json" \
  -d '{"transaction_id": "12345", "status": "pending"}'
```

### 3. Monitor Callbacks

View all received callbacks in the web interface:
- Filter by route
- Filter by date (for local storage)
- View detailed request data (headers, body, query params)
- Delete old callbacks

## Database Options

### Local JSON (Default)
- Files stored in `.db/callbacks/` directory
- Automatic daily rotation (e.g., `2025-11-27.json`)
- Routes stored in `.db/routes.json`

### SQLite
```env
DB_CONNECTION=sqlite
DB_PATHNAME=".db"
```

### MySQL
```env
DB_CONNECTION=mysql
DB_HOSTNAME=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=cbdamiy
```

### PostgreSQL
```env
DB_CONNECTION=postgresql
DB_HOSTNAME=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=cbdamiy
```

## API Endpoints

### Callback Management
- `GET /api/callbacks` - List all callbacks
- `GET /api/callbacks/:id` - Get callback details
- `DELETE /api/callbacks/:id` - Delete callback

### Route Management
- `GET /api/routes` - List all routes
- `POST /api/routes` - Create new route
- `PUT /api/routes/:id` - Update route
- `DELETE /api/routes/:id` - Delete route

### Dynamic Callback Endpoints
- `ALL /callback/*` - Receive callbacks on any registered path

## Security

The application uses IP whitelisting to protect the web interface and API endpoints. Configure allowed IPs in `.env`:

```env
WHILTELIST_IP=127.0.0.1,::1,localhost,192.168.1.100
```

**Note**: Callback endpoints (`/callback/*`) do NOT have IP restrictions by default, as they need to receive requests from external services.

## Project Structure

```
cbdamiy/
├── app/
│   ├── config/          # Configuration loader
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   └── views/           # EJS templates
├── public/
│   ├── css/             # Stylesheets
│   └── js/              # Client-side JavaScript
├── .env.example         # Environment template
├── server.js            # Main application entry
└── package.json         # Dependencies
```

## License

ISC
