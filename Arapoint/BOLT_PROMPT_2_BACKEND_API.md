# Arapoint - Part 2: Backend API & Authentication
## For Bolt.new Account #2

## Project Overview
Build the complete REST API backend for a Nigerian Identity Verification Platform called Arapoint. This includes all API endpoints, authentication, middleware, and payment integration.

**Tech Stack:** Node.js, Express, TypeScript, Zod validation, JWT authentication

**Note:** This API will connect to a database layer (built separately) and trigger RPA jobs (processed separately).

---

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── env.ts               # Environment variables
│   │
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.ts          # User authentication
│   │   │   ├── users.ts         # User management
│   │   │   ├── bvn.ts           # BVN services endpoints
│   │   │   ├── education.ts     # Education services endpoints
│   │   │   ├── identity.ts      # Identity verification endpoints
│   │   │   ├── birth.ts         # Birth certificate endpoints
│   │   │   ├── airtime.ts       # Airtime VTU endpoints
│   │   │   ├── data.ts          # Data VTU endpoints
│   │   │   ├── electricity.ts   # Electricity subscription
│   │   │   ├── cable.ts         # Cable subscription
│   │   │   ├── wallet.ts        # Wallet management
│   │   │   ├── payment.ts       # Payment gateway
│   │   │   └── admin.ts         # Admin panel endpoints
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT authentication
│   │   │   ├── validation.ts    # Zod validation
│   │   │   ├── errorHandler.ts  # Error handling
│   │   │   └── rateLimit.ts     # Rate limiting
│   │   │
│   │   └── validators/
│   │       ├── auth.ts
│   │       ├── bvn.ts
│   │       ├── education.ts
│   │       ├── identity.ts
│   │       ├── vtu.ts
│   │       └── payment.ts
│   │
│   ├── services/
│   │   ├── userService.ts       # User business logic
│   │   ├── walletService.ts     # Wallet logic
│   │   ├── paymentService.ts    # Payment processing
│   │   ├── jobService.ts        # RPA job creation
│   │   └── reportService.ts     # Report generation
│   │
│   ├── utils/
│   │   ├── logger.ts            # Winston logging
│   │   ├── helpers.ts           # Helper functions
│   │   └── constants.ts         # Constants
│   │
│   └── index.ts                 # Entry point
│
├── .env.example
├── package.json
└── tsconfig.json
```

---

## API Endpoints Specification

### Authentication Endpoints
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login (returns JWT + refresh token)
POST   /api/auth/refresh           # Refresh JWT token
POST   /api/auth/logout            # Logout (invalidate refresh token)
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password    # Reset password with token
```

### User Endpoints
```
GET    /api/users/profile          # Get user profile
PUT    /api/users/profile          # Update profile
GET    /api/users/dashboard        # Dashboard overview (stats)
```

### BVN Services Endpoints
```
POST   /api/bvn/retrieve           # Retrieve BVN info (creates RPA job)
POST   /api/bvn/digital-card       # Request digital BVN card
POST   /api/bvn/modify             # Modify BVN details
GET    /api/bvn/history            # BVN request history
GET    /api/bvn/job/:jobId         # Check job status
```

### Education Services Endpoints
```
POST   /api/education/jamb          # JAMB score lookup
POST   /api/education/waec          # WAEC result
POST   /api/education/neco          # NECO result
POST   /api/education/nabteb        # NABTEB result
POST   /api/education/nbais         # NBAIS result
GET    /api/education/history       # Education service history
GET    /api/education/job/:jobId    # Check job status
```

### Identity Verification Endpoints
```
POST   /api/identity/nin            # NIN lookup
POST   /api/identity/nin-phone      # NIN + Phone verification
POST   /api/identity/lost-nin       # Lost NIN recovery
GET    /api/identity/history        # Verification history
GET    /api/identity/job/:jobId     # Check job status
```

### Birth Certificate Endpoints
```
POST   /api/birth/attestation       # Birth certificate request
GET    /api/birth/history           # Birth cert history
GET    /api/birth/job/:jobId        # Check job status
```

### Airtime VTU Endpoints
```
POST   /api/airtime/buy             # Purchase airtime
GET    /api/airtime/presets         # Get preset amounts
GET    /api/airtime/history         # Airtime purchase history
```

### Data VTU Endpoints
```
POST   /api/data/buy                # Purchase data
GET    /api/data/plans              # Available plans by network
GET    /api/data/history            # Data purchase history
```

### Electricity Endpoints
```
POST   /api/electricity/buy         # Purchase electricity token
POST   /api/electricity/validate    # Validate meter number
GET    /api/electricity/providers   # List DISCOs
GET    /api/electricity/history     # Purchase history
```

### Cable Endpoints
```
POST   /api/cable/buy               # Purchase cable subscription
POST   /api/cable/validate          # Validate smartcard
GET    /api/cable/providers         # List cable providers
GET    /api/cable/packages/:provider # Get packages for provider
GET    /api/cable/history           # Purchase history
```

### Wallet Endpoints
```
GET    /api/wallet/balance          # Check wallet balance
POST   /api/wallet/fund             # Initialize funding
GET    /api/wallet/history          # Transaction history
```

### Payment Gateway Endpoints
```
POST   /api/payment/paystack/init   # Initialize Paystack payment
POST   /api/payment/paystack/verify # Verify Paystack payment (webhook)
POST   /api/payment/palmpay/init    # Initialize PalmPay payment
POST   /api/payment/palmpay/verify  # Verify PalmPay payment
```

### Admin Endpoints
```
GET    /api/admin/stats             # Global statistics
GET    /api/admin/services          # List all services
PUT    /api/admin/services/:id      # Update service config
GET    /api/admin/users             # List users (paginated)
GET    /api/admin/users/:id         # Get user details
PUT    /api/admin/users/:id/status  # Update user status
GET    /api/admin/transactions      # All transactions (paginated)
GET    /api/admin/rpa/jobs          # Monitor RPA jobs
POST   /api/admin/rpa/retry/:jobId  # Retry failed job
```

---

## Authentication & Security

### JWT Authentication Pattern
```typescript
// Login response
{
  accessToken: "jwt_token_here",     // Expires in 1 hour
  refreshToken: "refresh_token",      // Expires in 7 days
  user: { id, email, name }
}

// All protected routes require:
Authorization: Bearer <accessToken>
```

### Middleware Implementation

**auth.ts** - JWT verification middleware
**validation.ts** - Zod schema validation middleware
**errorHandler.ts** - Global error handler
**rateLimit.ts** - Rate limiting:
- Public endpoints: 10 requests/minute per IP
- Authenticated: 100 requests/minute per user

---

## Response Patterns

### Success Response
```json
{
  "status": "success",
  "code": 200,
  "message": "Operation completed successfully",
  "data": { }
}
```

### Error Response
```json
{
  "status": "error",
  "code": 400,
  "message": "Validation error",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### RPA Job Created Response
```json
{
  "status": "success",
  "code": 202,
  "message": "Request submitted for processing",
  "data": {
    "jobId": "uuid",
    "status": "pending",
    "estimatedTime": "5-10 seconds"
  }
}
```

---

## Service Layer

### jobService.ts
Create RPA jobs in the queue:
```typescript
async function createJob(userId: string, serviceType: string, queryData: object, priority?: number) {
  // Insert into rpa_jobs table with status="pending"
  // Return job ID for tracking
}

async function getJobStatus(jobId: string) {
  // Return job status and result if completed
}
```

### walletService.ts
```typescript
async function getBalance(userId: string)
async function deductBalance(userId: string, amount: number, description: string)
async function addBalance(userId: string, amount: number, reference: string)
async function getTransactionHistory(userId: string, page: number, limit: number)
```

### paymentService.ts
```typescript
async function initializePaystack(userId: string, amount: number, email: string)
async function verifyPaystack(reference: string)
async function initializePalmpay(userId: string, amount: number)
async function verifyPalmpay(reference: string)
```

---

## Environment Variables

```
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Payment Gateways
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PALMPAY_API_KEY=xxxxx
PALMPAY_SECRET_KEY=xxxxx

# Database (will be provided by Part 1)
DATABASE_URL=postgresql://...

# Logging
LOG_LEVEL=info
```

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "typescript": "^5.0.0",
  "zod": "^3.22.0",
  "jsonwebtoken": "^9.1.0",
  "bcryptjs": "^2.4.3",
  "dotenv": "^16.3.0",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^7.0.0",
  "axios": "^1.6.0",
  "winston": "^3.11.0",
  "uuid": "^9.0.0"
}
```

---

## Deliverables

1. Complete Express API with all routes
2. JWT authentication system with refresh tokens
3. All middleware (auth, validation, error handling, rate limit)
4. Zod validators for all endpoints
5. Service layer for business logic
6. Payment gateway integration (Paystack, PalmPay)
7. Winston logging setup
8. Proper error handling

---

## Notes for Merging

This API layer will:
- Import database schemas from Part 1 (Database)
- Create jobs that Part 3 (RPA Robot) will process
- Export API for frontend integration

The API creates jobs in `rpa_jobs` table. The RPA Robot (Part 3) processes these jobs.
