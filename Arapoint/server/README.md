# Arapoint Backend API

Complete backend implementation for the Arapoint Nigerian Identity Verification Platform with RPA (Robotic Process Automation) bot layer.

## Project Structure

```
server/src/
├── config/           # Configuration files
├── db/              # Database schema and migrations
├── api/             # API routes and middleware
├── services/        # Business logic services
├── rpa/             # RPA bot and workers
├── utils/           # Utility functions
└── types/           # TypeScript type definitions
```

## Installation

```bash
npm install
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Update all environment variables with your credentials
3. Ensure PostgreSQL is running

## Running the Server

```bash
npm run dev    # Development
npm run build  # Build
npm start      # Production
```

## API Documentation

All API endpoints return standardized JSON responses:

### Success Response
```json
{
  "status": "success",
  "code": 200,
  "message": "Operation completed successfully",
  "data": {...}
}
```

### Error Response
```json
{
  "status": "error",
  "code": 400,
  "message": "Error message",
  "errors": [{"field": "email", "message": "Invalid email"}]
}
```

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## RPA Bot

The RPA bot handles automated queries to third-party services that don't expose public APIs.

### Job Statuses
- `pending` - Waiting in queue
- `processing` - Currently being executed
- `completed` - Successfully completed
- `failed` - Failed after retries

### Supported Services
- BVN Service
- NIN Service
- JAMB Service
- WAEC Service
- NECO Service
- NABTEB Service
- NBAIS Service
- NPC Birth Certificate
- VTU (Airtime/Data)
- Subscriptions (Electricity/Cable)

## Database

PostgreSQL database with complete schema for all services.

### Migrations

```bash
npm run db:migrate   # Run migrations
npm run db:seed      # Seed sample data
```

## Development

### Adding New Routes

1. Create route file in `src/api/routes/`
2. Import and register in main server file
3. Add middleware as needed

### Adding New Workers

1. Create worker file in `src/rpa/workers/`
2. Extend base worker class
3. Implement service integration
4. Register in job processor

## Testing

```bash
npm run test
```

## Deployment

1. Build: `npm run build`
2. Set environment variables
3. Run migrations: `npm run db:migrate`
4. Start server: `npm start`

## Support

For issues or questions, contact: admin@arapoint.com
