# Code Patterns and Conventions

## Overview
This document defines the coding standards, design patterns, and conventions used throughout the project. All developers and AI agents should follow these patterns for consistency.

---

## Naming Conventions

### General Rules
| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `userName`, `isActive` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_KEY` |
| Functions | camelCase | `getUserById()`, `calculateTotal()` |
| Classes | PascalCase | `UserService`, `DatabaseConnection` |
| Interfaces | PascalCase with 'I' prefix | `IUserRepository`, `ILogger` |
| Types | PascalCase with 'T' prefix | `TUserRole`, `TApiResponse` |
| Enums | PascalCase | `UserStatus`, `ErrorCode` |
| Files | kebab-case or camelCase | `user-service.ts`, `apiHelpers.js` |
| Components | PascalCase | `UserProfile`, `NavigationBar` |
| Database Tables | snake_case | `user_accounts`, `order_items` |
| Database Columns | snake_case | `created_at`, `user_id` |
| API Endpoints | kebab-case | `/api/user-profiles`, `/auth/reset-password` |
| Environment Variables | UPPER_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |

### Language-Specific Conventions

#### TypeScript/JavaScript
```typescript
// Interfaces
interface IUserService {
  getUser(id: string): Promise<User>;
}

// Types
type TUserRole = 'admin' | 'user' | 'guest';

// Enums
enum Status {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

// Classes
class UserController {
  private userService: IUserService;
  
  async handleGetUser(req: Request): Promise<Response> {
    // Method implementation
  }
}
```

#### Python
```python
# Classes (PascalCase)
class UserService:
    # Methods (snake_case)
    def get_user_by_id(self, user_id: str) -> User:
        pass

# Functions (snake_case)
def calculate_discount(price: float, rate: float) -> float:
    pass

# Constants (UPPER_SNAKE_CASE)
MAX_CONNECTIONS = 100
DEFAULT_TIMEOUT = 30

# Private methods/variables (leading underscore)
def _internal_helper():
    pass
```

#### Go
```go
// Exported (PascalCase)
type UserService struct {
    repository UserRepository
}

func (s *UserService) GetUser(id string) (*User, error) {
    return s.repository.FindByID(id)
}

// Unexported (camelCase)
func validateInput(input string) error {
    // validation logic
}

// Constants (PascalCase or CAPS)
const MaxRetries = 3
const DEFAULT_TIMEOUT = 30
```

---

## File Organization

### Standard Structure
```typescript
// 1. File header comment (if needed)
/**
 * @fileoverview User service implementation
 * @module services/user
 */

// 2. Imports (grouped and ordered)
// External imports first
import express from 'express';
import { logger } from 'winston';

// Internal/project imports
import { DatabaseConnection } from '@/database';
import { UserRepository } from '@/repositories';

// Relative imports last
import { validateUser } from './validators';
import { UserDTO } from './types';

// 3. Constants
const MAX_LOGIN_ATTEMPTS = 5;
const TOKEN_EXPIRY = '24h';

// 4. Types/Interfaces
interface IUserService {
  // ...
}

// 5. Main class/function
export class UserService implements IUserService {
  // ...
}

// 6. Helper functions
function hashPassword(password: string): string {
  // ...
}

// 7. Exports (if not already exported)
export { hashPassword };
```

### Directory Structure Patterns
```
src/
├── controllers/        # Request handlers
├── services/          # Business logic
├── repositories/      # Data access layer
├── models/           # Data models/entities
├── utils/            # Utility functions
├── middleware/       # Express/HTTP middleware
├── config/           # Configuration files
├── types/            # TypeScript type definitions
├── validators/       # Input validation
├── errors/           # Custom error classes
└── tests/            # Test files
```

---

## Design Patterns

### Repository Pattern
```typescript
// Abstract data access logic
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

class UserRepository implements IRepository<User> {
  constructor(private db: DatabaseConnection) {}
  
  async findById(id: string): Promise<User | null> {
    const result = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
    return result ? this.mapToUser(result) : null;
  }
  
  private mapToUser(data: any): User {
    // Map database result to domain model
    return new User(data);
  }
}
```

### Service Layer Pattern
```typescript
// Encapsulate business logic
class UserService {
  constructor(
    private userRepo: IUserRepository,
    private emailService: IEmailService,
    private logger: ILogger
  ) {}
  
  async registerUser(data: RegisterDTO): Promise<UserDTO> {
    // Validate input
    const validated = await this.validateRegistration(data);
    
    // Business logic
    const hashedPassword = await hashPassword(validated.password);
    const user = await this.userRepo.create({
      ...validated,
      password: hashedPassword
    });
    
    // Side effects
    await this.emailService.sendWelcomeEmail(user.email);
    this.logger.info('User registered', { userId: user.id });
    
    // Return DTO
    return this.toDTO(user);
  }
}
```

### Factory Pattern
```typescript
// Object creation abstraction
abstract class NotificationFactory {
  abstract createNotification(): INotification;
  
  send(message: string): void {
    const notification = this.createNotification();
    notification.send(message);
  }
}

class EmailNotificationFactory extends NotificationFactory {
  createNotification(): INotification {
    return new EmailNotification();
  }
}

class SMSNotificationFactory extends NotificationFactory {
  createNotification(): INotification {
    return new SMSNotification();
  }
}

// Usage
const factory = new EmailNotificationFactory();
factory.send('Hello World');
```

### Singleton Pattern
```typescript
// Single instance throughout application
class Database {
  private static instance: Database;
  private connection: Connection;
  
  private constructor() {
    this.connection = this.createConnection();
  }
  
  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
  
  query(sql: string, params?: any[]): Promise<any> {
    return this.connection.execute(sql, params);
  }
}
```

### Observer Pattern
```typescript
// Event-driven communication
class EventEmitter {
  private events: Map<string, Function[]> = new Map();
  
  on(event: string, handler: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
  }
  
  emit(event: string, data?: any): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}
```

### Strategy Pattern
```typescript
// Interchangeable algorithms
interface IPricingStrategy {
  calculatePrice(basePrice: number): number;
}

class RegularPricing implements IPricingStrategy {
  calculatePrice(basePrice: number): number {
    return basePrice;
  }
}

class PremiumPricing implements IPricingStrategy {
  calculatePrice(basePrice: number): number {
    return basePrice * 0.8; // 20% discount
  }
}

class PricingContext {
  constructor(private strategy: IPricingStrategy) {}
  
  setStrategy(strategy: IPricingStrategy): void {
    this.strategy = strategy;
  }
  
  calculateFinalPrice(basePrice: number): number {
    return this.strategy.calculatePrice(basePrice);
  }
}
```

---

## Error Handling Patterns

### Custom Error Classes
```typescript
// Base error class
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Specific error types
class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}
```

### Try-Catch Pattern
```typescript
// Consistent error handling
async function handleRequest(req: Request): Promise<Response> {
  try {
    // Validate input
    const validated = validate(req.body);
    
    // Process request
    const result = await service.process(validated);
    
    // Return success response
    return {
      success: true,
      data: result
    };
  } catch (error) {
    // Log error
    logger.error('Request failed', { error, req });
    
    // Handle known errors
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      };
    }
    
    // Handle unknown errors
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    };
  }
}
```

### Error Middleware Pattern
```typescript
// Express error middleware
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message
      }
    });
  }
  
  // Log unexpected errors
  logger.error('Unexpected error', { err, req });
  
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
}
```

---

## API Patterns

### RESTful Conventions
```
GET    /api/v1/users           # List all users
GET    /api/v1/users/:id       # Get specific user
POST   /api/v1/users           # Create new user
PUT    /api/v1/users/:id       # Update entire user
PATCH  /api/v1/users/:id       # Update partial user
DELETE /api/v1/users/:id       # Delete user

# Nested resources
GET    /api/v1/users/:id/posts # Get user's posts
POST   /api/v1/users/:id/posts # Create post for user

# Actions
POST   /api/v1/users/:id/activate   # Activate user
POST   /api/v1/users/:id/reset-password # Reset password
```

### Request/Response Format
```typescript
// Request with validation
interface CreateUserRequest {
  body: {
    email: string;
    password: string;
    name: string;
  };
  headers: {
    'content-type': 'application/json';
  };
}

// Success response
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    version: string;
  };
}

// Error response
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

// Paginated response
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

## Database Patterns

### Query Builder Pattern
```typescript
// Fluent interface for building queries
class QueryBuilder {
  private query: string = '';
  private params: any[] = [];
  
  select(fields: string[]): this {
    this.query = `SELECT ${fields.join(', ')}`;
    return this;
  }
  
  from(table: string): this {
    this.query += ` FROM ${table}`;
    return this;
  }
  
  where(condition: string, value?: any): this {
    this.query += ` WHERE ${condition}`;
    if (value !== undefined) {
      this.params.push(value);
    }
    return this;
  }
  
  build(): { query: string; params: any[] } {
    return { query: this.query, params: this.params };
  }
}
```

### Migration Pattern
```sql
-- migrations/20250115120000_create_users_table.sql

-- Up Migration
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Down Migration
DROP TABLE IF EXISTS users;
```

### Transaction Pattern
```typescript
// Ensure data consistency
async function transferFunds(fromId: string, toId: string, amount: number): Promise<void> {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Deduct from sender
    await connection.query(
      'UPDATE accounts SET balance = balance - ? WHERE id = ?',
      [amount, fromId]
    );
    
    // Add to receiver
    await connection.query(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [amount, toId]
    );
    
    // Log transaction
    await connection.query(
      'INSERT INTO transactions (from_id, to_id, amount) VALUES (?, ?, ?)',
      [fromId, toId, amount]
    );
    
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

---

## Testing Patterns

### Test Structure (AAA Pattern)
```typescript
describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<IUserRepository>;
  
  beforeEach(() => {
    // Arrange - Setup
    mockRepository = createMockRepository();
    userService = new UserService(mockRepository);
  });
  
  describe('getUser', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = '123';
      const expectedUser = { id: userId, name: 'John' };
      mockRepository.findById.mockResolvedValue(expectedUser);
      
      // Act
      const result = await userService.getUser(userId);
      
      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
    });
    
    it('should throw NotFoundError when user not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(userService.getUser('999'))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
```

### Mock Patterns
```typescript
// Mock factory
function createMockRepository(): jest.Mocked<IUserRepository> {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };
}

// Mock with behavior
const mockEmailService = {
  sendEmail: jest.fn().mockImplementation((to, subject) => {
    if (!to.includes('@')) {
      throw new Error('Invalid email');
    }
    return Promise.resolve({ messageId: '123' });
  })
};
```

### Test Data Builders
```typescript
// Builder pattern for test data
class UserBuilder {
  private user: Partial<User> = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User'
  };
  
  withId(id: string): this {
    this.user.id = id;
    return this;
  }
  
  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }
  
  build(): User {
    return this.user as User;
  }
}

// Usage
const user = new UserBuilder()
  .withEmail('custom@example.com')
  .build();
```

---

## Security Patterns

### Input Validation
```typescript
// Validation schema using Joi/Yup/Zod
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  age: z.number().min(18).max(120)
});

function validateUser(input: unknown): ValidatedUser {
  try {
    return userSchema.parse(input);
  } catch (error) {
    throw new ValidationError('Invalid user data', error.errors);
  }
}
```

### Authentication Middleware
```typescript
// JWT authentication
async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = await userService.findById(decoded.userId);
    
    if (!req.user) {
      throw new UnauthorizedError('User not found');
    }
    
    next();
  } catch (error) {
    next(error);
  }
}
```

### Authorization Pattern
```typescript
// Role-based access control
function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    
    next();
  };
}

// Usage
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
```

---

## Performance Patterns

### Caching Strategy
```typescript
// Multi-level caching
class CacheService {
  private memoryCache = new Map();
  private redisClient: RedisClient;
  
  async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    
    // L2: Redis cache
    const redisValue = await this.redisClient.get(key);
    if (redisValue) {
      const parsed = JSON.parse(redisValue);
      this.memoryCache.set(key, parsed);
      return parsed;
    }
    
    return null;
  }
  
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    // Set in both caches
    this.memoryCache.set(key, value);
    await this.redisClient.setex(key, ttl, JSON.stringify(value));
    
    // Clean memory cache after TTL
    setTimeout(() => this.memoryCache.delete(key), ttl * 1000);
  }
}
```

### Batch Processing
```typescript
// Process items in batches
async function processBatch<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  
  return results;
}
```

### Connection Pooling
```typescript
// Database connection pool
class ConnectionPool {
  private pool: Connection[] = [];
  private available: Connection[] = [];
  private maxSize: number = 10;
  
  async getConnection(): Promise<Connection> {
    if (this.available.length > 0) {
      return this.available.pop()!;
    }
    
    if (this.pool.length < this.maxSize) {
      const conn = await this.createConnection();
      this.pool.push(conn);
      return conn;
    }
    
    // Wait for available connection
    return new Promise((resolve) => {
      const checkAvailable = setInterval(() => {
        if (this.available.length > 0) {
          clearInterval(checkAvailable);
          resolve(this.available.pop()!);
        }
      }, 100);
    });
  }
  
  releaseConnection(conn: Connection): void {
    this.available.push(conn);
  }
}
```

---

## Frontend Patterns

### Component Structure
```typescript
// React/Angular/Vue component patterns

// Container Component (Smart)
const UserListContainer: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUsers().then(setUsers).finally(() => setLoading(false));
  }, []);
  
  if (loading) return <LoadingSpinner />;
  
  return <UserList users={users} onUserClick={handleUserClick} />;
};

// Presentational Component (Dumb)
interface UserListProps {
  users: User[];
  onUserClick: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({ users, onUserClick }) => (
  <ul>
    {users.map(user => (
      <li key={user.id} onClick={() => onUserClick(user)}>
        {user.name}
      </li>
    ))}
  </ul>
);
```

### State Management Pattern
```typescript
// Redux/MobX/Zustand pattern
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
}

interface AppActions {
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  toggleTheme: () => void;
}

const useAppStore = create<AppState & AppActions>((set) => ({
  user: null,
  isAuthenticated: false,
  theme: 'light',
  
  login: async (credentials) => {
    const user = await authService.login(credentials);
    set({ user, isAuthenticated: true });
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
  
  toggleTheme: () => {
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' }));
  }
}));
```

### Custom Hook Pattern
```typescript
// Reusable logic in hooks
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const abortController = new AbortController();
    
    fetch(url, { signal: abortController.signal })
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
    
    return () => abortController.abort();
  }, [url]);
  
  return { data, loading, error };
}
```

---

## Documentation Patterns

### Code Comments
```typescript
/**
 * Calculates the compound interest for a given investment
 * 
 * @param principal - Initial investment amount in dollars
 * @param rate - Annual interest rate as a decimal (e.g., 0.05 for 5%)
 * @param time - Investment period in years
 * @param n - Number of times interest is compounded per year
 * @returns Final amount after compound interest
 * 
 * @example
 * // Calculate interest for $1000 at 5% for 10 years, compounded monthly
 * const amount = calculateCompoundInterest(1000, 0.05, 10, 12);
 * console.log(amount); // 1647.01
 * 
 * @throws {ValidationError} If any parameter is negative
 */
function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number,
  n: number
): number {
  if (principal < 0 || rate < 0 || time < 0 || n <= 0) {
    throw new ValidationError('All parameters must be non-negative');
  }
  
  return principal * Math.pow(1 + rate / n, n * time);
}
```

### AIDEV Comments
```typescript
// AIDEV-NOTE: Performance critical path - optimized for speed over memory
// Uses memoization to cache results for repeated calculations

// AIDEV-TODO: Implement rate limiting to prevent API abuse
// Consider using sliding window algorithm for better accuracy

// AIDEV-QUESTION: Should we handle timezone conversion here or in the client?
// Current implementation assumes UTC
```

### README Pattern
```markdown
# Project Name

## Overview
Brief description of what the project does

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`typescript
import { Feature } from 'package';

const result = Feature.process(data);
\`\`\`

## API Reference
Document all public APIs

## Contributing
Guidelines for contributors

## License
License information
```

---

## Git Patterns

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation only
- style: Code style (formatting, semicolons, etc)
- refactor: Code restructuring without behavior change
- perf: Performance improvement
- test: Adding or updating tests
- chore: Maintenance tasks

Examples:
feat(auth): add password reset functionality
fix(api): handle null response from external service
docs(readme): update installation instructions
```

### Branch Naming
```
feature/TASK-123-user-authentication
bugfix/TASK-456-fix-memory-leak
hotfix/TASK-789-critical-security-patch
release/v1.2.0
```

---

## AIDEV Specific Patterns

### Task Documentation
```markdown
# TASK-001-dwarf-planning.md

## Task Overview
- **ID**: TASK-001
- **Agent**: Dwarf
- **Priority**: High
- **Estimated**: 4 hours

## Objectives
1. Implement user authentication
2. Add password reset functionality

## Technical Approach
- Use JWT for token management
- Implement refresh token rotation
- Store sessions in Redis

## Success Criteria
- [ ] All tests passing
- [ ] Security review completed
- [ ] Documentation updated
```

### Agent Collaboration Pattern
```typescript
// AIDEV-NOTE: Interface designed for agent collaboration
// Architect defines contract, Dwarf implements, Seer tests

interface IUserService {
  // AIDEV-NOTE: Architect - Define clear contract
  getUser(id: string): Promise<User>;
  
  // AIDEV-TODO: Elf - Add UI caching strategy
  updateUser(id: string, data: Partial<User>): Promise<User>;
  
  // AIDEV-QUESTION: Security - Should we audit all deletions?
  deleteUser(id: string): Promise<void>;
}
```

---

*Last Updated: [Date]*
*These patterns should be consistently followed by all team members and AI agents*