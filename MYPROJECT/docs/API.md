# Finance Tracker API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-app-name.herokuapp.com/api
```

## Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this consistent format:
```json
{
  "success": true,
  "message": "Success message",
  "data": {...},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [...],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Create a new user account and send OTP verification email.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email with the OTP sent.",
  "data": {
    "userId": "64f8a1234567890123456789",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

### Verify OTP
**POST** `/auth/verify-otp`

Verify email with OTP and complete registration.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "64f8a1234567890123456789",
      "name": "John Doe",
      "email": "john@example.com",
      "isVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f8a1234567890123456789",
      "name": "John Doe",
      "email": "john@example.com",
      "isVerified": true,
      "lastLogin": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get User Profile
**GET** `/auth/profile`
🔒 *Requires Authentication*

Get current user's profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f8a1234567890123456789",
      "name": "John Doe",
      "email": "john@example.com",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLogin": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Resend OTP
**POST** `/auth/resend-otp`

Resend OTP for email verification.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

### Logout
**POST** `/auth/logout`
🔒 *Requires Authentication*

Logout user (mainly for client-side token removal).

---

## Transaction Endpoints

### Get All Transactions
**GET** `/transactions`
🔒 *Requires Authentication*

Retrieve user's transactions with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `type` (string): Filter by "income" or "expense"
- `category` (string): Filter by category
- `search` (string): Search in description and category
- `startDate` (ISO date): Filter from date
- `endDate` (ISO date): Filter to date
- `sortBy` (string): Sort by "date", "amount", "category", "type" (default: "date")
- `sortOrder` (string): "asc" or "desc" (default: "desc")

**Example Request:**
```
GET /transactions?page=1&limit=20&type=expense&category=Food&sortBy=amount&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "64f8a1234567890123456789",
        "type": "expense",
        "amount": 50.25,
        "category": "Food & Dining",
        "description": "Lunch at restaurant",
        "date": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 100,
      "pageSize": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "summary": {
      "totalIncome": 2500.00,
      "totalExpense": 1800.50,
      "netAmount": 699.50,
      "totalTransactions": 100
    }
  }
}
```

### Get Single Transaction
**GET** `/transactions/:id`
🔒 *Requires Authentication*

Get a specific transaction by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "_id": "64f8a1234567890123456789",
      "type": "expense",
      "amount": 50.25,
      "category": "Food & Dining",
      "description": "Lunch at restaurant",
      "date": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Create Transaction
**POST** `/transactions`
🔒 *Requires Authentication*

Create a new transaction.

**Request Body:**
```json
{
  "type": "expense",
  "amount": 50.25,
  "category": "Food & Dining",
  "description": "Lunch at restaurant",
  "date": "2024-01-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "transaction": {
      "_id": "64f8a1234567890123456789",
      "type": "expense",
      "amount": 50.25,
      "category": "Food & Dining",
      "description": "Lunch at restaurant",
      "date": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Update Transaction
**PUT** `/transactions/:id`
🔒 *Requires Authentication*

Update an existing transaction.

**Request Body:** (all fields optional)
```json
{
  "type": "income",
  "amount": 75.00,
  "category": "Freelance",
  "description": "Website project payment",
  "date": "2024-01-02T00:00:00.000Z"
}
```

### Delete Transaction
**DELETE** `/transactions/:id`
🔒 *Requires Authentication*

Delete a transaction.

**Response:**
```json
{
  "success": true,
  "message": "Transaction deleted successfully",
  "data": {
    "deletedTransaction": {
      "id": "64f8a1234567890123456789",
      "type": "expense",
      "amount": 50.25,
      "category": "Food & Dining",
      "date": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Bulk Delete Transactions
**DELETE** `/transactions/bulk`
🔒 *Requires Authentication*

Delete multiple transactions.

**Request Body:**
```json
{
  "transactionIds": [
    "64f8a1234567890123456789",
    "64f8a1234567890123456790"
  ]
}
```

### Get Categories
**GET** `/transactions/categories`
🔒 *Requires Authentication*

Get user's transaction categories with usage statistics.

**Query Parameters:**
- `type` (string): Filter by "income" or "expense"

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "Food & Dining",
        "type": "expense",
        "count": 15,
        "totalAmount": 450.75,
        "avgAmount": 30.05,
        "lastUsed": "2024-01-01T00:00:00.000Z"
      }
    ],
    "totalCategories": 10
  }
}
```

### Export Transactions
**GET** `/transactions/export`
🔒 *Requires Authentication*

Export transactions data.

**Query Parameters:**
- `format` (string): "json" or "csv" (default: "json")
- `startDate` (ISO date): Filter from date
- `endDate` (ISO date): Filter to date

---

## Analytics Endpoints

### Get Financial Summary
**GET** `/analytics/summary`
🔒 *Requires Authentication*

Get financial summary for dashboard.

**Query Parameters:**
- `period` (string): "today", "week", "month", "year", "custom", "all"
- `startDate` (ISO date): Required if period is "custom"
- `endDate` (ISO date): Required if period is "custom"

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": 3000.00,
      "totalExpense": 2200.50,
      "netAmount": 799.50,
      "totalTransactions": 45,
      "avgIncome": 500.00,
      "avgExpense": 73.35,
      "incomeCount": 6,
      "expenseCount": 39
    },
    "recentTransactions": [
      {
        "_id": "64f8a1234567890123456789",
        "type": "expense",
        "amount": 25.99,
        "category": "Transportation",
        "description": "Gas",
        "date": "2024-01-01T00:00:00.000Z"
      }
    ],
    "period": "month"
  }
}
```

### Get Spending Trends
**GET** `/analytics/trends`
🔒 *Requires Authentication*

Get spending and income trends over time.

**Query Parameters:**
- `period` (string): "month", "week", "day" (default: "month")
- `months` (number): Number of periods to include (default: 6, max: 36)

**Response:**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "_id": {
          "year": 2024,
          "month": 1
        },
        "income": 3000.00,
        "expense": 2200.50,
        "net": 799.50,
        "incomeCount": 6,
        "expenseCount": 39
      }
    ],
    "period": "month"
  }
}
```

### Get Category Breakdown
**GET** `/analytics/categories`
🔒 *Requires Authentication*

Get category breakdown for expenses or income.

**Query Parameters:**
- `type` (string): "expense" or "income" (default: "expense")
- `period` (string): "week", "month", "year" (default: "month")

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "Food & Dining",
        "total": 450.75,
        "count": 15,
        "avgAmount": 30.05,
        "percentage": 20.49
      }
    ],
    "totalAmount": 2200.50,
    "period": "month",
    "type": "expense"
  }
}
```

### Get Monthly Comparison
**GET** `/analytics/monthly-comparison`
🔒 *Requires Authentication*

Compare income and expenses across multiple months.

**Query Parameters:**
- `months` (number): Number of months to compare (default: 6, max: 24)

**Response:**
```json
{
  "success": true,
  "data": {
    "comparison": [
      {
        "_id": {
          "year": 2024,
          "month": 1
        },
        "income": 3000.00,
        "expense": 2200.50,
        "net": 799.50,
        "monthName": "Jan"
      }
    ]
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Rate Limiting

API requests are rate limited:
- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per 15 minutes per user
- **Bulk operations**: 10 requests per hour per user

## Data Validation

### Transaction Fields
- `type`: Required, must be "income" or "expense"
- `amount`: Required, positive number, max 2 decimal places, max 999,999.99
- `category`: Required, 1-50 characters, alphanumeric with spaces
- `description`: Optional, max 200 characters
- `date`: Optional, ISO 8601 format, within reasonable range

### User Fields
- `name`: 2-50 characters, letters and spaces only
- `email`: Valid email format, max 100 characters
- `password`: 8-128 characters, must include uppercase, lowercase, number, and special character

### Query Parameters
- `page`: Positive integer, max 1000
- `limit`: 1-100
- `dates`: Valid ISO 8601 format
- `sortOrder`: "asc" or "desc"

## SDK and Libraries

### JavaScript/Node.js
```javascript
const FinanceTrackerAPI = require('finance-tracker-sdk');

const client = new FinanceTrackerAPI({
  baseURL: 'https://your-api-url.com/api',
  token: 'your-jwt-token'
});

// Get transactions
const transactions = await client.transactions.list({
  page: 1,
  limit: 20,
  type: 'expense'
});
```

### cURL Examples

**Register User:**
```bash
curl -X POST https://your-api-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Get Transactions:**
```bash
curl -X GET "https://your-api-url.com/api/transactions?page=1&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

**Create Transaction:**
```bash
curl -X POST https://your-api-url.com/api/transactions \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "expense",
    "amount": 50.25,
    "category": "Food & Dining",
    "description": "Lunch"
  }'
```

## Postman Collection

Import our Postman collection for easy API testing:
[Download Finance Tracker API Collection](./postman/Finance-Tracker-API.postman_collection.json)

## Changelog

### v1.0.0 (2024-01-01)
- Initial API release
- Authentication with OTP verification
- CRUD operations for transactions
- Analytics endpoints
- Rate limiting and security features

---

For more information or support, please contact: [support@financetracker.com](mailto:support@financetracker.com)