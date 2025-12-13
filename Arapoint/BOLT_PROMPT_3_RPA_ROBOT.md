# Arapoint - Part 3: RPA Robot & Automation Layer
## For Bolt.new Account #3

## Project Overview
Build the RPA (Robotic Process Automation) robot layer for a Nigerian Identity Verification Platform called Arapoint. This robot handles automated queries to third-party services (NIN, BVN, JAMB, WAEC, etc.) that don't expose public APIs.

**Tech Stack:** Node.js, TypeScript, Puppeteer/Playwright, Bull Queue, Redis

**Note:** This RPA system processes jobs created by the Backend API (built separately) and stores results in the database (built separately).

---

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts               # Environment variables
│   │   └── rpa.ts               # RPA configuration
│   │
│   ├── rpa/
│   │   ├── bot.ts               # Main RPA bot controller
│   │   ├── queue.ts             # Bull job queue processor
│   │   ├── scheduler.ts         # Job scheduling & execution
│   │   │
│   │   ├── workers/
│   │   │   ├── baseWorker.ts    # Base worker class
│   │   │   ├── bvnWorker.ts     # BVN query automation
│   │   │   ├── ninWorker.ts     # NIN query automation
│   │   │   ├── jambWorker.ts    # JAMB score automation
│   │   │   ├── waecWorker.ts    # WAEC result automation
│   │   │   ├── necoWorker.ts    # NECO result automation
│   │   │   ├── nabtebWorker.ts  # NABTEB result automation
│   │   │   ├── nbaisWorker.ts   # NBAIS result automation
│   │   │   ├── npcWorker.ts     # NPC birth cert automation
│   │   │   ├── vtuWorker.ts     # VTU automation (airtime/data)
│   │   │   └── subscriptionWorker.ts # Subscription automation
│   │   │
│   │   └── integrations/
│   │       ├── browserManager.ts    # Puppeteer/Playwright manager
│   │       ├── credentialManager.ts # Manage login credentials
│   │       ├── ninService.ts        # NIN service integration
│   │       ├── bvnService.ts        # BVN service integration
│   │       ├── jambService.ts       # JAMB service integration
│   │       ├── waecService.ts       # WAEC service integration
│   │       ├── necoService.ts       # NECO service integration
│   │       ├── npcService.ts        # NPC service integration
│   │       └── vtuProvider.ts       # VTU provider integration
│   │
│   ├── utils/
│   │   ├── logger.ts            # Logging utility
│   │   ├── encryption.ts        # Decrypt credentials
│   │   └── helpers.ts           # Helper functions
│   │
│   └── index.ts                 # RPA entry point
│
├── .env.example
├── package.json
└── tsconfig.json
```

---

## RPA Architecture Overview

### Job Flow
```
1. Backend API creates job in rpa_jobs table (status="pending")
2. Bull Queue picks up pending jobs based on priority
3. Scheduler assigns job to appropriate worker
4. Worker executes using stored credentials
5. Worker updates job with result (status="completed" or "failed")
6. Backend API polls or receives webhook notification
```

### Concurrent Processing
```
- Max 20 concurrent jobs processing simultaneously
- Priority queue (0-10, higher = more urgent)
- Job timeout: 60 seconds per query
- Retry logic with exponential backoff (1s, 2s, 4s)
- Max retries: 3
```

---

## Queue System (queue.ts)

### Bull Queue Setup
```typescript
import Bull from 'bull';

const rpaQueue = new Bull('rpa-jobs', {
  redis: { host: 'localhost', port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    timeout: 60000,
    removeOnComplete: 100,
    removeOnFail: 500
  }
});

// Process jobs with concurrency of 20
rpaQueue.process(20, async (job) => {
  const { serviceType, queryData, userId } = job.data;
  return await processJob(serviceType, queryData, userId);
});
```

### Job Status Updates
```typescript
// Update job status in database
async function updateJobStatus(jobId: string, status: string, result?: object, error?: string) {
  await db.update(rpaJobs).set({
    status,
    result: result || null,
    error_message: error || null,
    completed_at: status === 'completed' || status === 'failed' ? new Date() : null
  }).where(eq(rpaJobs.id, jobId));
}
```

---

## Base Worker Class (baseWorker.ts)

```typescript
abstract class BaseWorker {
  protected serviceName: string;
  protected browser: Browser | null = null;
  
  abstract execute(queryData: object): Promise<WorkerResult>;
  
  async getCredentials(): Promise<Credentials> {
    // Fetch and decrypt credentials from bot_credentials table
  }
  
  async initBrowser(): Promise<Browser> {
    // Initialize Puppeteer/Playwright with stealth settings
  }
  
  async closeBrowser(): Promise<void> {
    // Cleanup browser instance
  }
  
  protected async retry<T>(fn: () => Promise<T>, maxAttempts: number): Promise<T> {
    // Retry logic with exponential backoff
  }
}
```

---

## Worker Implementations

### 1. BVN Worker (bvnWorker.ts)
```typescript
class BVNWorker extends BaseWorker {
  serviceName = 'bvn_service';
  
  async execute(queryData: { bvn: string; phone?: string; serviceType: string }): Promise<WorkerResult> {
    const credentials = await this.getCredentials();
    const browser = await this.initBrowser();
    
    try {
      // Navigate to BVN portal
      // Login with credentials
      // Submit query with BVN/phone
      // Extract result (name, DOB, photo, account info)
      // Return structured result
    } finally {
      await this.closeBrowser();
    }
  }
}
```

**Operations:**
- Retrieve BVN info
- Get digital BVN card
- Modify BVN details

**Input:** BVN (11 digits), Phone (optional)
**Output:** Full name, DOB, Photo URL, Account info

### 2. NIN Worker (ninWorker.ts)
```typescript
class NINWorker extends BaseWorker {
  serviceName = 'nin_service';
  
  async execute(queryData: { nin?: string; phone?: string; enrollmentId?: string; type: string }): Promise<WorkerResult> {
    // Similar pattern to BVN worker
  }
}
```

**Operations:**
- Basic NIN lookup
- NIN + Phone verification
- Lost NIN recovery (using second enrollment ID)

**Input:** NIN (11 digits), Phone (optional), Second enrollment ID (for recovery)
**Output:** Full name, DOB, Address, Photo URL

### 3. JAMB Worker (jambWorker.ts)
```typescript
class JAMBWorker extends BaseWorker {
  serviceName = 'jamb_service';
  
  async execute(queryData: { registrationNumber: string; queryType: string }): Promise<WorkerResult> {
    // Navigate to JAMB portal
    // Submit registration number
    // Extract scores, admission status, etc.
  }
}
```

**Query Types:**
- Score check
- Registration lookup
- Admission status
- Application status
- Course allocation

**Input:** Registration number
**Output:** Exam scores, Course allocation, Status

### 4. WAEC Worker (waecWorker.ts)
```typescript
class WAECWorker extends BaseWorker {
  serviceName = 'waec_service';
  
  async execute(queryData: { registrationNumber: string; examYear: number }): Promise<WorkerResult> {
    // Navigate to WAEC result portal
    // Submit registration number and year
    // Extract results
  }
}
```

**Input:** Registration number, Exam year
**Output:** Subject results with grades

### 5. NECO Worker (necoWorker.ts)
Similar to WAEC worker for NECO results.

### 6. NABTEB Worker (nabtebWorker.ts)
Similar pattern for NABTEB certification results.

### 7. NBAIS Worker (nbaisWorker.ts)
Similar pattern for NBAIS (National Board for Arabic and Islamic Studies) results.

### 8. NPC Worker (npcWorker.ts)
```typescript
class NPCWorker extends BaseWorker {
  serviceName = 'npc_service';
  
  async execute(queryData: { fullName: string; dob: string; registrationNumber?: string }): Promise<WorkerResult> {
    // Navigate to NPC portal
    // Submit birth certificate request
    // Extract certificate data
  }
}
```

**Input:** Full name, Date of birth, Registration number (optional)
**Output:** Birth certificate data, attestation status

### 9. VTU Worker (vtuWorker.ts)
```typescript
class VTUWorker extends BaseWorker {
  serviceName = 'vtu_service';
  
  async execute(queryData: { type: 'airtime' | 'data'; network: string; phone: string; amount?: number; plan?: string }): Promise<WorkerResult> {
    // Connect to VTU provider API
    // Process airtime/data purchase
    // Return transaction confirmation
  }
}
```

**Input:** Network, Phone number, Amount/Plan
**Output:** Transaction ID, Status, Reference

### 10. Subscription Worker (subscriptionWorker.ts)
```typescript
class SubscriptionWorker extends BaseWorker {
  serviceName = 'subscription_service';
  
  async execute(queryData: { type: 'electricity' | 'cable'; provider: string; meter?: string; smartcard?: string; amount: number }): Promise<WorkerResult> {
    // Process electricity token or cable subscription
  }
}
```

**Input:** Provider, Meter/Smartcard number, Amount
**Output:** Token/Subscription confirmation, Reference

---

## Browser Manager (browserManager.ts)

```typescript
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

class BrowserManager {
  private browsers: Map<string, Browser> = new Map();
  
  async getBrowser(workerId: string): Promise<Browser> {
    if (!this.browsers.has(workerId)) {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
      this.browsers.set(workerId, browser);
    }
    return this.browsers.get(workerId)!;
  }
  
  async closeBrowser(workerId: string): Promise<void> {
    const browser = this.browsers.get(workerId);
    if (browser) {
      await browser.close();
      this.browsers.delete(workerId);
    }
  }
  
  async closeAll(): Promise<void> {
    for (const browser of this.browsers.values()) {
      await browser.close();
    }
    this.browsers.clear();
  }
}
```

---

## Credential Manager (credentialManager.ts)

```typescript
class CredentialManager {
  async getCredentials(serviceName: string): Promise<ServiceCredentials> {
    const cred = await db.query.botCredentials.findFirst({
      where: and(
        eq(botCredentials.serviceName, serviceName),
        eq(botCredentials.isActive, true)
      )
    });
    
    if (!cred) throw new Error(`No credentials for ${serviceName}`);
    
    // Decrypt password/token
    const decryptedPassword = decrypt(cred.passwordHash);
    
    return {
      username: cred.username,
      password: decryptedPassword,
      apiKey: cred.apiKey,
      authToken: cred.authToken
    };
  }
  
  async refreshToken(serviceName: string): Promise<void> {
    // Refresh expired tokens
  }
  
  async isTokenExpired(serviceName: string): Promise<boolean> {
    const cred = await db.query.botCredentials.findFirst({
      where: eq(botCredentials.serviceName, serviceName)
    });
    return cred?.tokenExpiry ? new Date() > cred.tokenExpiry : false;
  }
}
```

---

## Scheduler (scheduler.ts)

```typescript
import cron from 'node-cron';

class Scheduler {
  async start() {
    // Poll for pending jobs every 5 seconds
    cron.schedule('*/5 * * * * *', async () => {
      await this.processPendingJobs();
    });
    
    // Cleanup completed jobs every hour
    cron.schedule('0 * * * *', async () => {
      await this.cleanupOldJobs();
    });
    
    // Refresh tokens every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      await this.refreshAllTokens();
    });
  }
  
  async processPendingJobs() {
    const pendingJobs = await db.query.rpaJobs.findMany({
      where: eq(rpaJobs.status, 'pending'),
      orderBy: [desc(rpaJobs.priority), asc(rpaJobs.createdAt)],
      limit: 20
    });
    
    for (const job of pendingJobs) {
      await rpaQueue.add(job);
    }
  }
}
```

---

## Error Handling

```typescript
interface WorkerResult {
  success: boolean;
  data?: object;
  error?: string;
  shouldRetry?: boolean;
}

// In queue processor
rpaQueue.on('failed', async (job, err) => {
  const { jobId } = job.data;
  
  if (job.attemptsMade >= job.opts.attempts) {
    // Final failure - update database
    await updateJobStatus(jobId, 'failed', null, err.message);
    // Notify user (webhook/email)
    await notifyUser(job.data.userId, 'job_failed', { jobId, error: err.message });
  }
});

rpaQueue.on('completed', async (job, result) => {
  const { jobId } = job.data;
  await updateJobStatus(jobId, 'completed', result.data);
  // Notify user
  await notifyUser(job.data.userId, 'job_completed', { jobId, result: result.data });
});
```

---

## Environment Variables

```
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RPA Configuration
RPA_MAX_CONCURRENT_JOBS=20
RPA_JOB_TIMEOUT=60000
RPA_RETRY_MAX=3
RPA_RETRY_BACKOFF=exponential

# Browser
PUPPETEER_HEADLESS=true
BROWSER_TIMEOUT=30000

# Database (provided by Part 1)
DATABASE_URL=postgresql://...

# Encryption (for credential decryption)
ENCRYPTION_KEY=your_32_byte_encryption_key

# Logging
LOG_LEVEL=info
```

---

## Dependencies

```json
{
  "typescript": "^5.0.0",
  "puppeteer": "^21.0.0",
  "puppeteer-extra": "^3.3.0",
  "puppeteer-extra-plugin-stealth": "^2.11.0",
  "bull": "^4.11.4",
  "redis": "^4.6.0",
  "node-cron": "^3.0.2",
  "winston": "^3.11.0",
  "axios": "^1.6.0",
  "dotenv": "^16.3.0"
}
```

---

## Query Limits Per Service

| Service | Concurrent Limit | Timeout |
|---------|-----------------|---------|
| BVN | 20/minute | 60s |
| NIN | 20/minute | 60s |
| JAMB | 20/minute | 60s |
| WAEC | 20/minute | 60s |
| NECO | 20/minute | 60s |
| NABTEB | 20/minute | 60s |
| NBAIS | 20/minute | 60s |
| NPC | 20/minute | 60s |
| VTU | 20/minute | 30s |
| Subscriptions | 20/minute | 30s |

---

## Deliverables

1. Bull Queue setup with Redis
2. Base worker class with retry logic
3. All 10 worker implementations (BVN, NIN, JAMB, WAEC, NECO, NABTEB, NBAIS, NPC, VTU, Subscription)
4. Browser manager with stealth mode
5. Credential manager with encryption
6. Job scheduler
7. Error handling with notifications
8. Logging system

---

## Notes for Merging

This RPA layer will:
- Import database schemas from Part 1 (Database)
- Process jobs created by Part 2 (Backend API)
- Run as a separate process from the API

The RPA polls `rpa_jobs` table for pending jobs and updates results back to the database.
