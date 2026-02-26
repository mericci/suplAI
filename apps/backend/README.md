# SuplAI - Supabase Backend with Node.js

A production-ready backend API built with Node.js, TypeScript, and Supabase.

## Technology Stack

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript (strict mode)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **Testing**: Mocha + Chai
- **Validation**: Zod
- **Package Manager**: npm

## Project Structure

```
/
├── supabase/
│   ├── functions/        # Supabase Edge Functions
│   ├── migrations/       # Database migrations
│   └── config.toml       # Supabase configuration
├── src/
│   ├── lib/             # Core libraries and utilities
│   ├── api/             # API route handlers/controllers (thin layer)
│   ├── services/        # Business logic (modular structure)
│   │   └── users/       # Example: users service module (PLURAL)
│   │       ├── actions/      # Business logic implementations
│   │       ├── handlers/     # Expose actions
│   │       ├── helpers/      # Module-specific utilities
│   │       ├── types/        # Module-specific types
│   │       ├── config.ts     # Module configuration
│   │       └── index.ts      # Exports all handlers
│   ├── db/              # Data access layer (queries, repositories)
│   │   └── schemas/     # Zod validation schemas
│   ├── auth/            # Authentication and authorization logic
│   ├── storage/         # File storage operations
│   ├── types/           # Shared TypeScript types and interfaces
│   └── utils/           # Shared utilities and helpers
├── tests/               # Test files (*.test.ts)
├── package.json        # Node.js configuration
├── tsconfig.json       # TypeScript configuration
├── .env.example        # Environment variables template
└── README.md           # This file
```

## Architecture

### Separation of Concerns

- **`src/api/`**: HTTP handlers and route controllers (thin layer)
- **`src/services/`**: Business logic (modular structure)
  - Each service is a folder (plural): `users/`, `products/`, `orders/`
  - Contains: `actions/` (logic), `handlers/` (expose), `helpers/` (utilities), `types/` (types), `config.ts` (config), `index.ts` (exports)
- **`src/db/`**: Data access layer (queries, repositories)
  - **`schemas/`**: Database validation schemas (Zod) - **validates data before DB**
- **`src/auth/`**: Authentication and authorization logic
- **`src/storage/`**: File storage operations
- **`src/utils/`**: Shared utilities and helpers
- **`src/types/`**: Shared TypeScript types

### Flow Example

```
Request → API Handler → Service Handler → Action → DB Query → Response
         (validate)   (expose)          (logic)  (data)
```

### Modular Service Structure

Each service module follows this pattern:

```
services/users/           # Service name (PLURAL)
├── actions/             # Business logic files
│   ├── get-user.ts     # Generic GET (by id, email, etc.)
│   ├── create-user.ts
│   └── ...
├── handlers/            # Expose actions (same filenames)
│   ├── get-user.ts
│   └── ...
├── helpers/             # Module-specific helpers
│   └── validate-user.ts
├── types/               # Module-specific types
│   └── index.ts
├── config.ts            # Module configuration
└── index.ts             # Exports all handlers
```

### Type Organization

- **Shared types** (used in multiple services): `src/types/`
- **Service-specific types** (used in one service only): `src/services/[service_name]/types/`

### Database Validation

All data is validated using Zod schemas before database operations:

```typescript
// Define schema
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  // ...
});

// Validate data
const validatedData = validateCreateUser(userData);
```

Schemas are located in `src/db/schemas/` and exported via `index.ts`.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+ installed
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd suplAI
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your Supabase credentials:
```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
API_PORT=8000
API_HOST=localhost
```

### Development

Start the development server with hot reload:
```bash
npm run dev
```

The server will start at `http://localhost:8000`.

### Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

### Linting & Formatting

Run linter:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

Format code:
```bash
npm run fmt
```

Check formatting:
```bash
npm run fmt:check
```

Type checking:
```bash
npm run type-check
```

### Validation

Run all checks (format, lint, type-check, tests):
```bash
npm run validate
```

### Building

Build for production:
```bash
npm run build
```

Run production build:
```bash
npm start
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm start` | Run production build |
| `npm run build` | Build TypeScript to JavaScript |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run fmt` | Format code with Prettier |
| `npm run fmt:check` | Check code formatting |
| `npm run type-check` | Run TypeScript type checking |
| `npm run validate` | Run all checks (format, lint, type-check, tests) |
| `npm run clean` | Clean build artifacts and dependencies |

## Supabase Commands

### Database Migrations

Create a new migration:
```bash
supabase migration new migration_name
```

Apply migrations to local database:
```bash
supabase db push
```

Generate TypeScript types from database:
```bash
supabase gen types typescript --local > src/types/supabase.ts
```

### Edge Functions

Create a new Edge Function:
```bash
supabase functions new function_name
```

Serve Edge Functions locally:
```bash
supabase functions serve
```

Deploy Edge Function:
```bash
supabase functions deploy function_name
```

### Local Development

Start Supabase locally:
```bash
supabase start
```

Stop Supabase:
```bash
supabase stop
```

## Environment Variables

Required environment variables:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (admin) |
| `API_PORT` | Port for the API server (default: 8000) |
| `API_HOST` | Host for the API server (default: localhost) |

## API Endpoints

### Health Check
- `GET /health` - Check API health

### Users
- `GET /api/users` - List users (with pagination)
- `GET /api/users/:id` - Get user by ID or email
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user (requires auth)
- `DELETE /api/users/:id` - Delete user (requires auth)

## Authentication

The API uses JWT authentication via Supabase Auth. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Best Practices

### Service Structure
- Use plural names for service folders (`users/`, not `user/`)
- Keep API handlers thin - delegate to services
- Implement business logic in actions
- Use handlers to expose actions
- Keep helpers module-specific

### Type Safety
- Use strict TypeScript mode
- Define types for all data structures
- Validate with Zod schemas before database operations
- Organize types: shared in `src/types/`, service-specific in service folder

### Error Handling
- Use the `getErrorMessage()` utility for safe error handling
- Handle errors gracefully in catch blocks
- Log errors with context using the logger utility

### Testing
- Write tests for business logic
- Use Mocha + Chai for unit and integration tests
- Mock database calls in tests
- Aim for high test coverage

### Code Quality
- Follow ESLint rules
- Use Prettier for consistent formatting
- Run `npm run validate` before committing
- Keep functions small and focused

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run validate` to ensure quality
4. Submit a pull request

## License

MIT
