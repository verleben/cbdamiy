# CB Dummy - Usage Examples

## Quick Start

1. **Start the server:**
```bash
npm start
```

2. **Access Web Interface:**
Open browser: `http://localhost:58592`

## Example Workflow

### Step 1: Create Callback Routes

Create routes via API:

```bash
# Create route for transaction start
curl -X POST http://localhost:58592/api/routes \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/transaction-start",
    "name": "Transaction Start",
    "description": "Called when transaction starts"
  }'

# Create route for transaction paid
curl -X POST http://localhost:58592/api/routes \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/transaction-paid",
    "name": "Transaction Paid",
    "description": "Called when payment is completed"
  }'
```

Or use the web interface at: `http://localhost:58592/routes`

### Step 2: Send Callbacks

External services can now send callbacks to your endpoints:

```bash
# Callback 1: Transaction Start
curl -X POST http://localhost:58592/callback/transaction-start \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "TX-12345",
    "amount": 100000,
    "currency": "IDR",
    "customer_email": "user@example.com",
    "status": "pending"
  }'

# Callback 2: Transaction Paid
curl -X POST http://localhost:58592/callback/transaction-paid \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "TX-12345",
    "payment_method": "bank_transfer",
    "paid_at": "2025-11-27T14:30:00Z",
    "status": "completed"
  }'
```

### Step 3: View Callbacks

**Via Web Interface:**
- Dashboard: `http://localhost:58592`
- All Callbacks: `http://localhost:58592/callbacks`
- Filter by route, date, and pagination

**Via API:**
```bash
# Get all callbacks (sorted by newest first, limited to 100)
curl http://localhost:58592/api/callbacks

# Get callbacks with custom limit
curl "http://localhost:58592/api/callbacks?limit=50"

# Get callbacks for specific route
curl "http://localhost:58592/api/callbacks?route=/callback/transaction-start"

# Pagination
curl "http://localhost:58592/api/callbacks?limit=20&offset=0"
curl "http://localhost:58592/api/callbacks?limit=20&offset=20"

# Get specific callback by ID
curl http://localhost:58592/api/callbacks/1764253714436bcu3krtls
```

## Data Features

### Automatic Sorting
- **Callbacks**: Sorted by timestamp (newest first)
- **Routes**: Sorted by created_at (newest first)

### Pagination
- Default limit: 100 records
- Customizable with `?limit=50&offset=0`

### Daily Rotation (Local JSON)
- Callbacks stored in daily files: `.db/callbacks/2025-11-27.json`
- Automatically creates new file each day based on timezone
- Easy to archive or delete old data

## Testing Different Callback Scenarios

### GET Request with Query Parameters
```bash
curl "http://localhost:58592/callback/webhook?user_id=123&action=login"
```

### POST with Form Data
```bash
curl -X POST http://localhost:58592/callback/form-submit \
  -d "name=John Doe&email=john@example.com&message=Hello"
```

### PUT Request
```bash
curl -X PUT http://localhost:58592/callback/update-status \
  -H "Content-Type: application/json" \
  -d '{"status": "active", "updated_by": "admin"}'
```

### Custom Headers
```bash
curl -X POST http://localhost:58592/callback/webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: abc123" \
  -H "X-Webhook-ID: webhook-456" \
  -d '{"event": "user.created", "user_id": 789}'
```

## Filtering and Searching

### Filter by Route (Web UI)
1. Go to `http://localhost:58592/callbacks`
2. Select route from dropdown
3. Click "Apply Filters"

### Filter by Date (Local JSON only)
1. Go to `http://localhost:58592/callbacks`
2. Select date from dropdown (shows all available dates)
3. View callbacks from that specific day

### API Filtering
```bash
# Filter by route
curl "http://localhost:58592/api/callbacks?route=/callback/transaction-start"

# Combine filters
curl "http://localhost:58592/api/callbacks?route=/callback/transaction-start&limit=10"
```

## Managing Routes

### List All Routes
```bash
curl http://localhost:58592/api/routes
```

### Update Route
```bash
curl -X PUT http://localhost:58592/api/routes/ROUTE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "description": "Updated description"
  }'
```

### Delete Route
```bash
curl -X DELETE http://localhost:58592/api/routes/ROUTE_ID
```

## Database Switching

### Switch to SQLite
Edit `.env`:
```env
DB_CONNECTION=sqlite
DB_PATHNAME=".db"
```

### Switch to MySQL
Edit `.env`:
```env
DB_CONNECTION=mysql
DB_HOSTNAME=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=yourpassword
DB_DATABASE=cbdamiy
```

### Switch to PostgreSQL
Edit `.env`:
```env
DB_CONNECTION=postgresql
DB_HOSTNAME=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_DATABASE=cbdamiy
```

## Security Notes

**IP Whitelist:**
- Web interface and API management endpoints are IP protected
- Callback endpoints (`/callback/*`) are open to receive external requests
- Modify `WHILTELIST_IP` in `.env` to add authorized IPs

```env
# Allow specific IPs
WHILTELIST_IP=127.0.0.1,::1,192.168.1.100,192.168.1.101
```

## Tips

1. **Monitor in Real-time**: Keep the web interface open while testing callbacks
2. **Daily Cleanup**: For local JSON storage, old date files can be manually deleted
3. **Backup**: Export important callback data before switching database types
4. **Testing**: Use tools like Postman or curl for comprehensive callback testing
5. **Timezone**: Set `TZ` in `.env` to match your local timezone for accurate timestamps
