# Arapoint - Complete Backend, Database & RPA Specification for Bolt.new

## Project Overview
Build a production-ready Nigerian Identity Verification and Management Platform backend with an RPA (Robotic Process Automation) robot layer that handles manual API queries to third-party services that don't offer public APIs.

**Tech Stack:** Node.js + Express, PostgreSQL, TypeScript, Drizzle ORM, Zod validation

---

## Part 1: Database Schema (PostgreSQL)

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  wallet_balance DECIMAL(15, 2) DEFAULT 0,
  bvn VARCHAR(11),
  nin VARCHAR(11),
  kyc_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Keys & Credentials Table (For RPA Bot Access)
```sql
CREATE TABLE bot_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL, -- 'nin_service', 'bvn_service', 'jamb_service', 'waec_service', 'npc_service'
  username VARCHAR(255),
  password_hash VARCHAR(255),
  api_key VARCHAR(500),
  auth_token VARCHAR(1000),
  token_expiry TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### RPA Job Queue Table (For Task Distribution)
```sql
CREATE TABLE rpa_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  service_type VARCHAR(100) NOT NULL, -- 'bvn_retrieval', 'nin_lookup', 'jamb_score', 'waec_score', 'birth_cert'
  query_data JSONB NOT NULL, -- { "bvn": "12345678901", "phone": "+2348012345678" }
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  result JSONB, -- { "success": true, "data": {...} }
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  priority INT DEFAULT 0, -- 0-10, higher = more urgent
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

### BVN Services Table
```sql
CREATE TABLE bvn_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  bvn VARCHAR(11),
  phone VARCHAR(20),
  service_type VARCHAR(50), -- 'retrieval', 'digital_card', 'modification'
  request_id VARCHAR(100) UNIQUE,
  status VARCHAR(50), -- 'pending', 'successful', 'failed'
  response_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Education Services Table
```sql
CREATE TABLE education_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  service_type VARCHAR(100) NOT NULL, -- 'jamb_score', 'waec_result', 'neco_result', 'nabteb_result', 'nbais_result'
  exam_year INT,
  registration_number VARCHAR(100),
  status VARCHAR(50),
  result_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Identity Verification Table
```sql
CREATE TABLE identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  verification_type VARCHAR(100), -- 'nin', 'nin_with_phone', 'lost_nin_recovery'
  nin VARCHAR(11),
  phone VARCHAR(20),
  second_enrollment_id VARCHAR(100),
  status VARCHAR(50),
  verification_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Birth Certificate (NPC) Table
```sql
CREATE TABLE birth_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  full_name VARCHAR(255),
  date_of_birth DATE,
  registration_number VARCHAR(100),
  status VARCHAR(50),
  certificate_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### VTU Services - Airtime Table
```sql
CREATE TABLE airtime_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  network VARCHAR(50), -- 'mtn', 'airtel', 'glo', '9mobile'
  phone_number VARCHAR(20),
  amount DECIMAL(10, 2),
  type VARCHAR(50), -- 'sme', 'cg', 'gifting'
  transaction_id VARCHAR(100) UNIQUE,
  status VARCHAR(50), -- 'pending', 'successful', 'failed'
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### VTU Services - Data Table
```sql
CREATE TABLE data_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  network VARCHAR(50), -- 'mtn', 'airtel', 'glo', '9mobile'
  phone_number VARCHAR(20),
  plan_name VARCHAR(100),
  amount DECIMAL(10, 2),
  type VARCHAR(50), -- 'sme', 'cg', 'gifting'
  transaction_id VARCHAR(100) UNIQUE,
  status VARCHAR(50),
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Subscription Services - Electricity Table
```sql
CREATE TABLE electricity_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  disco_name VARCHAR(100), -- e.g., 'EKEDC', 'IKEDC', 'Ibadan'
  meter_number VARCHAR(50),
  amount DECIMAL(10, 2),
  transaction_id VARCHAR(100) UNIQUE,
  status VARCHAR(50),
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Subscription Services - Cable Table
```sql
CREATE TABLE cable_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  provider VARCHAR(100), -- 'dstv', 'gotv', 'startimes'
  smartcard_number VARCHAR(50),
  package VARCHAR(100),
  amount DECIMAL(10, 2),
  transaction_id VARCHAR(100) UNIQUE,
  status VARCHAR(50),
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Wallet & Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  transaction_type VARCHAR(50), -- 'fund_wallet', 'service_purchase', 'refund'
  amount DECIMAL(15, 2),
  payment_method VARCHAR(50), -- 'paystack', 'palmpay', 'bank_transfer'
  reference_id VARCHAR(100),
  status VARCHAR(50), -- 'pending', 'successful', 'failed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Admin Settings Table
```sql
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Part 2: File Structure & Architecture

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Database connection
│   │   ├── env.ts               # Environment variables
│   │   └── rpa.ts               # RPA configuration
│   │
│   ├── db/
│   │   ├── schema.ts            # Drizzle schema definitions
│   │   ├── migrations.ts         # Database migrations
│   │   └── seed.ts              # Database seeding
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
│   │   │   ├── electricity.ts   # Electricity subscription endpoints
│   │   │   ├── cable.ts         # Cable subscription endpoints
│   │   │   ├── wallet.ts        # Wallet management
│   │   │   ├── payment.ts       # Payment gateway (Paystack, PalmPay)
│   │   │   └── admin.ts         # Admin panel endpoints
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT authentication
│   │   │   ├── validation.ts    # Zod validation
│   │   │   ├── errorHandler.ts  # Error handling
│   │   │   └── rateLimit.ts     # Rate limiting
│   │   │
│   │   └── validators/
│   │       ├── bvn.ts
│   │       ├── education.ts
│   │       ├── identity.ts
│   │       ├── airtime.ts
│   │       ├── data.ts
│   │       └── ... (other validators)
│   │
│   ├── services/
│   │   ├── userService.ts       # User business logic
│   │   ├── walletService.ts     # Wallet logic
│   │   ├── paymentService.ts    # Payment processing
│   │   └── reportService.ts     # Report generation
│   │
│   ├── rpa/
│   │   ├── bot.ts               # Main RPA bot controller
│   │   ├── queue.ts             # Job queue processor
│   │   ├── workers/
│   │   │   ├── bvnWorker.ts     # BVN query automation
│   │   │   ├── ninWorker.ts     # NIN query automation
│   │   │   ├── jambWorker.ts    # JAMB score automation
│   │   │   ├── waecWorker.ts    # WAEC result automation
│   │   │   ├── npcWorker.ts     # NPC birth cert automation
│   │   │   ├── vtuWorker.ts     # VTU automation (airtime/data)
│   │   │   └── subscriptionWorker.ts # Subscription automation
│   │   │
│   │   ├── integrations/
│   │   │   ├── ninService.ts    # NIN service integration
│   │   │   ├── bvnService.ts    # BVN service integration
│   │   │   ├── jambService.ts   # JAMB service integration
│   │   │   ├── waecService.ts   # WAEC service integration
│   │   │   ├── npcService.ts    # NPC service integration
│   │   │   ├── vtuProvider.ts   # VTU provider integration
│   │   │   └── credentialManager.ts # Manage login credentials
│   │   │
│   │   └── scheduler.ts         # Job scheduling & execution
│   │
│   ├── utils/
│   │   ├── logger.ts            # Logging utility
│   │   ├── encryption.ts        # Encrypt credentials
│   │   ├── helpers.ts           # Helper functions
│   │   └── constants.ts         # Constants
│   │
│   └── index.ts                 # Entry point
│
├── .env.example                 # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

---

## Part 3: API Endpoints Specification

### Authentication Endpoints
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/refresh           # Refresh JWT token
POST   /api/auth/logout            # Logout
```

### User Endpoints
```
GET    /api/users/profile          # Get user profile
PUT    /api/users/profile          # Update profile
GET    /api/users/dashboard        # Dashboard overview
```

### BVN Services Endpoints
```
POST   /api/bvn/retrieve           # Retrieve BVN info
POST   /api/bvn/digital-card       # Get digital card
POST   /api/bvn/modify             # Modify BVN details
GET    /api/bvn/history            # BVN request history
```

### Education Services Endpoints
```
POST   /api/education/jamb          # JAMB score lookup
POST   /api/education/waec          # WAEC result
POST   /api/education/neco          # NECO result
POST   /api/education/nabteb        # NABTEB result
POST   /api/education/nbais         # NBAIS result
GET    /api/education/history       # Education service history
```

### Identity Verification Endpoints
```
POST   /api/identity/nin            # NIN lookup
POST   /api/identity/nin-phone      # NIN + Phone verification
POST   /api/identity/lost-nin       # Lost NIN recovery
GET    /api/identity/history        # Verification history
```

### Birth Certificate Endpoints
```
POST   /api/birth/attestation       # Birth certificate request
GET    /api/birth/history           # Birth cert history
```

### Airtime VTU Endpoints
```
POST   /api/airtime/buy             # Purchase airtime
GET    /api/airtime/history         # Airtime purchase history
POST   /api/airtime/presets         # Get preset amounts
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
GET    /api/electricity/providers   # List DISCOs
GET    /api/electricity/history     # Purchase history
```

### Cable Endpoints
```
POST   /api/cable/buy               # Purchase cable subscription
GET    /api/cable/providers         # List cable providers
GET    /api/cable/history           # Purchase history
```

### Wallet Endpoints
```
GET    /api/wallet/balance          # Check wallet balance
POST   /api/wallet/fund             # Fund wallet
GET    /api/wallet/history          # Transaction history
```

### Payment Gateway Endpoints
```
POST   /api/payment/paystack/init   # Initialize Paystack payment
POST   /api/payment/paystack/verify # Verify Paystack payment
POST   /api/payment/palmpay/init    # Initialize PalmPay payment
POST   /api/payment/palmpay/verify  # Verify PalmPay payment
```

### Admin Endpoints
```
GET    /api/admin/stats             # Global statistics
GET    /api/admin/services          # Manage services
POST   /api/admin/service-config    # Configure service
GET    /api/admin/users             # User management
GET    /api/admin/transactions      # Transaction history
POST   /api/admin/rpa/config        # RPA configuration
GET    /api/admin/rpa/jobs          # Monitor RPA jobs
```

---

## Part 4: RPA Robot Specification

### RPA Architecture Overview
The RPA robot handles automated queries to third-party services (NIN, BVN, JAMB, WAEC, NECO, NABTEB, NBAIS, NPC) that don't expose public APIs. The bot uses the user's personal credentials to submit queries and extract results.

### Job Queue System
```
1. User submits request via API
2. Request creates job in rpa_jobs table with status="pending"
3. RPA Queue processor picks job based on priority
4. Worker executes using stored credentials
5. Result stored back in rpa_jobs table
6. User notified of completion (webhook/polling)
```

### Worker Implementation Pattern
Each worker (BVN, NIN, JAMB, etc.) should:
1. Retrieve job from queue
2. Get stored credentials for that service
3. Use headless browser automation (Puppeteer/Playwright) or direct API if available
4. Submit query with user data
5. Extract results
6. Update job with status & result
7. Handle errors and retries

### Concurrent Query Management
```
- Max 20 concurrent jobs processing simultaneously
- Priority queue ensures urgent requests processed first
- Retry logic with exponential backoff
- Job timeout: 60 seconds per query
- Connection pooling for service integrations
```

### Credential Storage
```
Credentials stored encrypted in bot_credentials table:
- Service: service_name (bvn_service, nin_service, etc.)
- Username/Password or API keys
- Auth tokens with expiry management
- Auto-refresh tokens before expiry
```

### Error Handling & Retries
```
- On failure: increment retry_count
- Max retries: 3
- Backoff strategy: exponential (1s, 2s, 4s)
- Store error_message for debugging
- Webhook notification to frontend on final failure
```

### Services to Automate (With Query Limits)

#### 1. BVN Service (Bank Verification Number)
- **Queries:** 20/minute concurrent
- **Operations:** Retrieve info, Digital card, Modify details
- **Data needed:** BVN, Phone number
- **Output:** Name, DOB, Photo, Account info

#### 2. NIN Service (National ID Number)
- **Queries:** 20/minute concurrent
- **Operations:** Basic lookup, NIN + Phone verification, Lost NIN recovery
- **Data needed:** NIN, Phone (optional), Second enrollment ID
- **Output:** Full name, DOB, Address, Photo

#### 3. JAMB Service
- **Queries:** 20/minute concurrent
- **Sub-services:** Score check, Registration lookup, Admission status, Application status, Course allocation
- **Data needed:** Registration number
- **Output:** Exam scores, Course allocation, Status

#### 4. WAEC Service
- **Queries:** 20/minute concurrent
- **Data needed:** Registration number, Exam year
- **Output:** Exam results, Grades

#### 5. NECO Service
- **Queries:** 20/minute concurrent
- **Data needed:** Registration number
- **Output:** Exam results

#### 6. NABTEB Service
- **Queries:** 20/minute concurrent
- **Data needed:** Registration number
- **Output:** Exam results

#### 7. NBAIS Service
- **Queries:** 20/minute concurrent
- **Data needed:** Registration number
- **Output:** Certification data

#### 8. NPC Birth Certificate
- **Queries:** 20/minute concurrent
- **Data needed:** Full name, DOB, Registration number
- **Output:** Birth certificate data

#### 9. VTU Services (Airtime/Data)
- **Queries:** 20/minute concurrent
- **Data needed:** Phone number, Network, Amount/Plan
- **Output:** Transaction confirmation, Status

#### 10. Subscription Services (Electricity/Cable)
- **Queries:** 20/minute concurrent
- **Data needed:** Meter/Smartcard number, Amount
- **Output:** Token/Subscription confirmation

---

## Part 5: Environment Variables (.env)

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/arapoint
DB_SSL=true

# Server
PORT=3000
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# RPA Configuration
RPA_MAX_CONCURRENT_JOBS=20
RPA_JOB_TIMEOUT=60000
RPA_RETRY_MAX=3
RPA_RETRY_BACKOFF=exponential

# Payment Gateways
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
PALMPAY_API_KEY=xxxxx
PALMPAY_SECRET_KEY=xxxxx

# Third-Party Service Credentials (Encrypted)
BVN_SERVICE_USERNAME=your_bvn_account
BVN_SERVICE_PASSWORD=encrypted_password
NIN_SERVICE_USERNAME=your_nin_account
NIN_SERVICE_PASSWORD=encrypted_password
JAMB_SERVICE_USERNAME=your_jamb_account
JAMB_SERVICE_PASSWORD=encrypted_password
# ... other service credentials

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Admin
ADMIN_EMAIL=admin@arapoint.com
ADMIN_PHONE=+2348012345678
```

---

## Part 6: Authentication & Security Pattern

### JWT Authentication
```
1. User login → Generate JWT (expires 1 hour) + Refresh token (expires 7 days)
2. All API requests include: Authorization: Bearer <token>
3. Middleware verifies token signature
4. On expiry → Use refresh token to get new JWT
5. Refresh token stored securely in DB
```

### Credential Encryption
```
1. All service credentials encrypted with AES-256-GCM
2. Store encryption key in environment (never in code)
3. Decrypt credentials only when RPA worker needs them
4. Never log decrypted credentials
```

### Rate Limiting
```
- Public endpoints: 10 requests/minute per IP
- Authenticated endpoints: 100 requests/minute per user
- RPA queries: 20 concurrent per user max
```

---

## Part 7: Response Pattern (All Endpoints)

### Success Response
```json
{
  "status": "success",
  "code": 200,
  "message": "Operation completed successfully",
  "data": {
    // endpoint-specific data
  }
}
```

### Error Response
```json
{
  "status": "error",
  "code": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### RPA Job Response
```json
{
  "status": "success",
  "code": 202,
  "message": "Query submitted to RPA queue",
  "job_id": "uuid",
  "job_status": "pending",
  "estimated_wait_time": "5 seconds"
}
```

---

## Part 8: Implementation Priority

1. **Phase 1:** Database schema + User authentication + Wallet system
2. **Phase 2:** Payment gateway integration (Paystack/PalmPay)
3. **Phase 3:** RPA queue infrastructure + 1-2 sample workers
4. **Phase 4:** Complete all service workers (BVN, NIN, JAMB, etc.)
5. **Phase 5:** Admin panel APIs + Reporting
6. **Phase 6:** Performance optimization + Load testing

---

## Part 9: Dependencies & Libraries

```json
{
  "express": "^4.18.2",
  "typescript": "^5.0.0",
  "drizzle-orm": "^0.28.0",
  "pg": "^8.11.0",
  "zod": "^3.22.0",
  "jsonwebtoken": "^9.1.0",
  "bcryptjs": "^2.4.3",
  "dotenv": "^16.3.0",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.0.0",
  "puppeteer": "^21.0.0",
  "playwright": "^1.40.0",
  "axios": "^1.6.0",
  "bull": "^4.11.4",
  "redis": "^4.6.0",
  "node-cron": "^3.0.2",
  "winston": "^3.11.0",
  "crypto": "builtin"
}
```

---

## Part 10: Database Transactions

For critical operations (payments, wallet updates):
```typescript
const transaction = await db.transaction(async (trx) => {
  // Deduct from wallet
  await trx.update(users).set({ wallet_balance: ... })
  // Create transaction record
  await trx.insert(transactions).values({ ... })
  // Mark RPA job complete
  await trx.update(rpa_jobs).set({ status: 'completed' })
  return result
})
```

---

## Deliverables Expected

1. **Backend API** - All endpoints functional with proper validation
2. **Database** - Schema implemented with proper relationships
3. **RPA Bot** - Job queue processor + at least 3 sample workers
4. **Authentication** - JWT + Refresh token system
5. **Error Handling** - Proper error responses with status codes
6. **Logging** - Request/response logging with Winston
7. **Configuration** - Environment-based configuration
8. **Docker** - Dockerfile for containerization (optional)
9. **Tests** - Unit tests for critical services
10. **Documentation** - API documentation (Swagger/OpenAPI)

---

## Notes for Bolt.new

- This is a **mission-critical application** requiring robust error handling and security
- **RPA bot is essential** because major Nigerian verification services don't offer public APIs
- **Concurrent query handling** is important - ensure proper queue management for 20+ simultaneous queries
- **Credential security** is paramount - encrypt all service login credentials
- All responses should follow the provided JSON pattern
- Database transactions must be used for financial operations
- Implement comprehensive logging for debugging

---

## Additional Requirements

- Implement proper CORS policies
- Add request validation middleware
- Use database migrations (Drizzle migrations)
- Implement soft deletes where applicable
- Add audit logs for admin actions
- Implement webhook notifications
- Set up scheduled job cleanup (old jobs retention)
- Add API documentation (Swagger)
