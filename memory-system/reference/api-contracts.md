# Library Interface Contracts - WhatsApp Google Uploader

## Overview
This document defines all library interfaces, method signatures, and data contracts for the WhatsApp Google Uploader modular system.

---

## REST APIs

### Base Configuration
- **Base URL:** `https://api.example.com/v1`
- **Authentication:** Bearer Token / API Key / OAuth2
- **Rate Limiting:** 100 requests per minute
- **Versioning Strategy:** URL path versioning (v1, v2)

### Endpoints

#### User Management

##### GET /users
**Description:** Retrieve list of users  
**Authorization:** Required  
**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20)
- `sort` (string): Sort field (default: created_at)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "created_at": "ISO8601"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Error Responses:**
- `401`: Unauthorized
- `429`: Rate limit exceeded

##### POST /users
**Description:** Create new user  
**Authorization:** Admin only  
**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "user|admin"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "created_at": "ISO8601"
}
```

#### [Add more endpoints as needed]

---

## GraphQL API

### Schema Location
- **Endpoint:** `https://api.example.com/graphql`
- **Schema File:** `/schemas/graphql.schema`
- **Playground:** `https://api.example.com/playground`

### Core Types

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  publishedAt: DateTime
}

type Query {
  user(id: ID!): User
  users(page: Int, limit: Int): UserConnection!
  post(id: ID!): Post
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
}
```

---

## WebSocket Events

### Connection
- **URL:** `wss://api.example.com/ws`
- **Protocol:** Socket.IO / native WebSocket
- **Authentication:** Token in connection params

### Events

#### Client → Server

##### subscribe
```json
{
  "event": "subscribe",
  "data": {
    "channel": "updates",
    "filters": {}
  }
}
```

#### Server → Client

##### update
```json
{
  "event": "update",
  "data": {
    "type": "entity_changed",
    "entity": "user",
    "id": "uuid",
    "changes": {}
  }
}
```

---

## External API Integrations

### Payment Provider (Stripe/PayPal)
- **Documentation:** [Link to provider docs]
- **Webhook Endpoint:** `/webhooks/payments`
- **Events Handled:**
  - `payment.success`
  - `payment.failed`
  - `subscription.created`
  - `subscription.cancelled`

### Email Service (SendGrid/SES)
- **API Version:** v3
- **Rate Limits:** 100 emails/second
- **Templates:**
  - Welcome email: `template_001`
  - Password reset: `template_002`

### [Add other integrations]

---

## gRPC Services

### Proto Files Location
- `/protos/user.proto`
- `/protos/product.proto`

### Service Definitions

```proto
syntax = "proto3";

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (UserList);
  rpc CreateUser(CreateUserRequest) returns (User);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

---

## Event-Driven APIs

### Message Queue (RabbitMQ/Kafka)
- **Broker:** `broker.example.com:9092`
- **Topics/Exchanges:**
  - `user.events`
  - `order.events`
  - `notification.events`

### Event Schemas

#### UserCreatedEvent
```json
{
  "eventType": "user.created",
  "timestamp": "ISO8601",
  "data": {
    "userId": "uuid",
    "email": "string",
    "source": "web|mobile|api"
  }
}
```

---

## API Versioning Strategy

### Deprecation Policy
- Minimum 6 months notice
- Sunset headers in responses
- Migration guides provided

### Version Support
- **v1:** Maintenance mode (deprecated: 2025-06-01)
- **v2:** Current stable
- **v3:** Beta (not for production)

---

## Error Response Format

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {
      "field": "email",
      "reason": "invalid_format"
    },
    "request_id": "uuid",
    "documentation": "https://docs.api.com/errors/VALIDATION_ERROR"
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request data |
| UNAUTHORIZED | 401 | Missing or invalid auth |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Security Considerations

### Authentication Methods
- JWT tokens (15min expiry)
- API keys (for service-to-service)
- OAuth2 (for third-party integrations)

### CORS Policy
```json
{
  "allowed_origins": ["https://app.example.com"],
  "allowed_methods": ["GET", "POST", "PUT", "DELETE"],
  "allowed_headers": ["Authorization", "Content-Type"],
  "max_age": 86400
}
```

### Rate Limiting Rules
- Anonymous: 10 req/min
- Authenticated: 100 req/min
- Premium: 1000 req/min

---

## Testing

### Sandbox Environment
- **Base URL:** `https://sandbox.api.example.com`
- **Test Credentials:** Available in developer portal
- **Data Reset:** Daily at 00:00 UTC

### Postman Collection
- **Download:** `/docs/postman-collection.json`
- **Environment Variables:** `/docs/postman-env.json`

---

## Change Log

### 2025-01-15
- Added user management endpoints
- Implemented pagination

### [Date]
- [Changes]

---

*Last Updated: 2025-01-15*
*Note: Keep this file in sync with OpenAPI/AsyncAPI specifications*