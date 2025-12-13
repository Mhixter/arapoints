# Arapoint - Part 1: Database Schema & Core Setup
## For Bolt.new Account #1

## Project Overview
Build the database layer for a Nigerian Identity Verification Platform called Arapoint. This includes all PostgreSQL tables, Drizzle ORM schema, and database utilities.

**Tech Stack:** Node.js, TypeScript, PostgreSQL, Drizzle ORM, Zod validation

---

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Database connection
│   │   └── env.ts               # Environment variables
│   │
│   ├── db/
│   │   ├── schema.ts            # Drizzle schema definitions
│   │   ├── migrations.ts        # Database migrations
│   │   └── seed.ts              # Database seeding
│   │
│   ├── utils/
│   │   ├── encryption.ts        # Encrypt credentials
│   │   └── helpers.ts           # Helper functions
│   │
│   └── types/
│       └── index.ts             # TypeScript types
│
├── drizzle.config.ts
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Database Tables to Create

### 1. Users Table
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

### 2. Bot Credentials Table (For RPA Bot Access)
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

### 3. RPA Job Queue Table
```sql
CREATE TABLE rpa_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  service_type VARCHAR(100) NOT NULL, -- 'bvn_retrieval', 'nin_lookup', 'jamb_score', 'waec_score', 'birth_cert'
  query_data JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  result JSONB,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  priority INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

### 4. BVN Services Table
```sql
CREATE TABLE bvn_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  bvn VARCHAR(11),
  phone VARCHAR(20),
  service_type VARCHAR(50), -- 'retrieval', 'digital_card', 'modification'
  request_id VARCHAR(100) UNIQUE,
  status VARCHAR(50),
  response_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Education Services Table
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

### 6. Identity Verification Table
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

### 7. Birth Attestations Table
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

### 8. Airtime Services Table
```sql
CREATE TABLE airtime_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  network VARCHAR(50), -- 'mtn', 'airtel', 'glo', '9mobile'
  phone_number VARCHAR(20),
  amount DECIMAL(10, 2),
  type VARCHAR(50), -- 'sme', 'cg', 'gifting'
  transaction_id VARCHAR(100) UNIQUE,
  status VARCHAR(50),
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9. Data Services Table
```sql
CREATE TABLE data_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  network VARCHAR(50),
  phone_number VARCHAR(20),
  plan_name VARCHAR(100),
  amount DECIMAL(10, 2),
  type VARCHAR(50),
  transaction_id VARCHAR(100) UNIQUE,
  status VARCHAR(50),
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 10. Electricity Services Table
```sql
CREATE TABLE electricity_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  disco_name VARCHAR(100),
  meter_number VARCHAR(50),
  amount DECIMAL(10, 2),
  transaction_id VARCHAR(100) UNIQUE,
  status VARCHAR(50),
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 11. Cable Services Table
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

### 12. Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  transaction_type VARCHAR(50), -- 'fund_wallet', 'service_purchase', 'refund'
  amount DECIMAL(15, 2),
  payment_method VARCHAR(50), -- 'paystack', 'palmpay', 'bank_transfer'
  reference_id VARCHAR(100),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 13. Admin Settings Table
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

## Drizzle ORM Schema (schema.ts)

Create full Drizzle schema definitions for all tables above with:
- Proper TypeScript types
- Relations between tables
- Zod validation schemas for inserts
- Export insert/select types

---

## Database Utilities

### config/database.ts
- Database connection using Neon serverless
- Connection pooling
- Error handling

### utils/encryption.ts
- AES-256-GCM encryption for credentials
- Encrypt/decrypt functions
- Never log decrypted values

### db/seed.ts
- Seed admin settings
- Sample data for testing

---

## Environment Variables (.env.example)

```
DATABASE_URL=postgresql://user:password@localhost:5432/arapoint
DB_SSL=true
ENCRYPTION_KEY=your_32_byte_encryption_key_here
```

---

## Dependencies

```json
{
  "drizzle-orm": "^0.28.0",
  "@neondatabase/serverless": "^0.10.0",
  "drizzle-kit": "^0.19.0",
  "pg": "^8.11.0",
  "zod": "^3.22.0",
  "drizzle-zod": "^0.5.0",
  "dotenv": "^16.3.0"
}
```

---

## Deliverables

1. Complete Drizzle schema with all 13 tables
2. TypeScript types for all entities
3. Zod validation schemas
4. Database connection utility
5. Encryption utility for credentials
6. Seed file with sample data
7. Migration configuration

---

## Notes for Merging

This database layer will be imported by:
- Backend API (Part 2) - for data access
- RPA Robot (Part 3) - for job queue management

Export all schemas, types, and utilities for easy import.
