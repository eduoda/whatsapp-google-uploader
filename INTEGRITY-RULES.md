# INTEGRITY-RULES.md - Quality & Honesty Standards

## 🎯 Core Principle
**Fix the actual problem. Never create workarounds, fake fixes, or deceptive solutions.**

## ❌ NEVER Do These (Common Violations)

### 1. Test Manipulation
```diff
- ❌ WRONG: Test expects getUserById() to return user object
- // Creating special test-only function
- function getUserByIdForTest() {
-   return { id: 1, name: "Test User" }; // Fake data
- }
- 
- // Modifying test to accept different output
- expect(result).toBeUndefined(); // Changed from expecting user object
- 
- // Commenting out failing assertion
- // expect(user.email).toBe("test@example.com");

+ ✅ RIGHT: Fix the actual getUserById() implementation
+ // Debug why original function fails
+ console.log("Database connection:", dbStatus);
+ // Fix root cause in production code
+ async function getUserById(id) {
+   await ensureDbConnection(); // Fixed: was missing
+   return await db.users.findById(id);
+ }
```

### 2. Symptom Masking
```diff
- ❌ WRONG: API returns 500 error
- try {
-   const result = await apiCall();
- } catch (error) {
-   // Hide the error, pretend success
-   return { status: 200, data: [] };
- }

+ ✅ RIGHT: Fix the actual API
+ // Find why API returns 500
+ // - Check logs: "Database connection timeout"
+ // Fix: Increase connection pool size
+ const pool = mysql.createPool({
+   connectionLimit: 20, // Was 5, causing timeouts
+   // ... rest of config
+ });
```

### 3. Quick Hacks
```diff
- ❌ WRONG: Component renders slowly
- // Add spinner to hide slowness
- return <LoadingSpinner timeout={5000} />;
- 
- // Hardcode data instead of fetching
- const users = [{ id: 1, name: "John" }]; // Skip API

+ ✅ RIGHT: Fix performance issue
+ // Profile and identify bottleneck
+ const MemoizedList = React.memo(UserList);
+ // Implement proper caching
+ const users = useMemo(() => processUsers(data), [data]);
```

## ✅ Integrity Checklist

Before marking ANY task complete, verify:

```yaml
Root_Cause_Identified:
  - [ ] I understand WHY the problem exists
  - [ ] I can explain the root cause clearly
  - [ ] The fix addresses this root cause

Proper_Fix_Applied:
  - [ ] Solution fixes the actual problem
  - [ ] No special code paths for tests
  - [ ] No temporary workarounds

Tests_Pass_Legitimately:
  - [ ] Original tests pass without modification
  - [ ] Tests use real production code paths
  - [ ] No test-specific implementations

Quality_Improved:
  - [ ] Code is cleaner than before
  - [ ] No technical debt added
  - [ ] Solution is maintainable
```

## 🚨 Red Flags - Stop If You Think These

| Red Flag Thought | What It Means | Right Action |
|-----------------|---------------|--------------|
| "Just for the test..." | Creating fake code path | Stop. Fix real code |
| "Temporary fix..." | Adding technical debt | Stop. Do it properly |
| "Works around..." | Avoiding real problem | Stop. Address root cause |
| "Quick solution..." | Prioritizing speed | Stop. Prioritize correctness |
| "Modified test..." | Changing test to pass | Stop. Fix code instead |
| "Good enough..." | Accepting mediocrity | Stop. Meet standards |
| "Let's make a simpler version..." | Avoiding complexity of proper solution | Stop. Implement correctly |
| "This is too complicated..." | Wanting to skip proper implementation | Stop. Break down, don't simplify |
| "We can skip this part..." | Cutting corners | Stop. Implement fully |
| "It mostly works..." | Ignoring edge cases | Stop. Handle all cases |
| "Close enough..." | Accepting approximation | Stop. Be precise |
| "Nobody will notice..." | Hiding problems | Stop. Be transparent |
| "Ship it anyway..." | Rushing incomplete work | Stop. Complete properly |
| "We'll fix it later..." | Creating technical debt | Stop. Fix it now |
| "The test is wrong..." | Blaming the test | Stop. The test is the spec |
| "It works on my machine..." | Ignoring environment issues | Stop. Fix for all environments |
| "Just disable that check..." | Removing safeguards | Stop. Fix the underlying issue |
| "Let's mock this..." | Avoiding real integration | Stop. Test with real components |
| "Can we lower requirements..." | Reducing quality bar | Stop. Meet original requirements |

## 🔍 Root Cause Analysis Framework

```mermaid
graph TD
    A[Problem Occurs] --> B{Can see symptom?}
    B -->|Yes| C[Trace backwards]
    B -->|No| D[Add logging]
    C --> E{Found cause?}
    D --> B
    E -->|No| F[Go one level deeper]
    E -->|Yes| G[Verify it's root cause]
    F --> C
    G --> H{Is it the real source?}
    H -->|No| F
    H -->|Yes| I[Design proper fix]
    I --> J[Implement solution]
    J --> K[Verify tests pass]
```

## 📊 Decision Framework

### When Facing a Problem:

1. **Can I fix the root cause?**
   - YES → Do it properly, no shortcuts
   - NO → Document why and ask for help

2. **Is my solution honest?**
   - YES → Proceed with implementation
   - NO → Stop and reconsider approach

3. **Will this pass review?**
   - YES → Tests pass with real code
   - NO → Don't submit deceptive code

## 🛠️ Common Scenarios & Correct Approaches

### Scenario: Database Connection Fails in Test

❌ **Wrong Approaches:**
- Mock database to always succeed
- Skip database tests
- Create in-memory fake database
- Use SQLite instead of real database
- Comment out database-dependent tests

✅ **Right Approach:**
```bash
# Fix actual connection issue
1. Check connection string
2. Verify database is running
3. Ensure test database exists
4. Fix configuration
5. Use proper test database setup/teardown
```

### Scenario: Third-Party API Rate Limit

❌ **Wrong Approaches:**
- Remove API calls from tests
- Hardcode expected responses
- Disable rate limit checks
- Use unlimited mock API
- Skip integration tests

✅ **Right Approach:**
```javascript
// Implement proper rate limiting
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  perMilliseconds: 60000,
  testMode: process.env.NODE_ENV === 'test' // Use test quotas
});
```

### Scenario: Flaky Test Fails Randomly

❌ **Wrong Approaches:**
- Add retry logic to test
- Increase timeout to 60 seconds
- Mark test as "allowed to fail"
- Run test multiple times and take best result
- Skip test on CI

✅ **Right Approach:**
```javascript
// Find and fix race condition
await waitFor(() => {
  // Ensure state is settled before assertion
  expect(component.state).toBe('ready');
});
// Then test actual functionality
```

### Scenario: Complex Business Logic

❌ **Wrong Approaches:**
- "Simplify" by removing edge cases
- Create "basic" version missing features
- Hardcode values instead of calculating
- Skip validation steps
- Ignore error scenarios

✅ **Right Approach:**
```javascript
// Break down complexity, don't avoid it
function calculatePrice(items, customer) {
  const subtotal = calculateSubtotal(items);
  const discount = calculateDiscount(subtotal, customer);
  const tax = calculateTax(subtotal - discount);
  const shipping = calculateShipping(items, customer);
  
  // Handle ALL cases properly
  if (customer.isPremium) { /* ... */ }
  if (hasPromoCode) { /* ... */ }
  if (isBulkOrder) { /* ... */ }
  
  return subtotal - discount + tax + shipping;
}
```

### Scenario: Performance Issues

❌ **Wrong Approaches:**
- Hide with loading spinner
- Reduce functionality
- Process only partial data
- Add arbitrary delays
- Blame user's hardware

✅ **Right Approach:**
```javascript
// Profile, measure, optimize
const startTime = performance.now();

// Identify actual bottleneck
const results = await Promise.all(
  data.map(item => processItem(item)) // Found: N+1 query
);

// Fix root cause
const results = await batchProcess(data); // Batch processing

console.log(`Optimized from ${oldTime}ms to ${performance.now() - startTime}ms`);
```

### Scenario: Security Vulnerability

❌ **Wrong Approaches:**
- Hide the vulnerability
- Add superficial validation
- Obfuscate but not fix
- Document as "known issue"
- Rely on "security through obscurity"

✅ **Right Approach:**
```javascript
// Fix the actual vulnerability
// Before: SQL injection vulnerable
const query = `SELECT * FROM users WHERE id = ${userId}`;

// After: Properly parameterized
const query = 'SELECT * FROM users WHERE id = ?';
const result = await db.query(query, [userId]);

// Add proper validation
if (!isValidUserId(userId)) {
  throw new ValidationError('Invalid user ID');
}
```

## 📝 Documentation When Blocked

If you genuinely cannot fix root cause:

```markdown
## BLOCKED: Cannot Fix Root Cause

### Problem
[Describe the issue]

### Root Cause Identified
[Explain what's actually broken]

### Why I Cannot Fix
- [ ] Outside my scope (requires architecture change)
- [ ] Third-party limitation (vendor issue)
- [ ] Time constraint (would take X days)
- [ ] Missing permissions/access

### Proposed Workaround
[If applicable, describe temporary measure]

### Long-term Solution Needed
[What should be done eventually]

### Risk Assessment
- Impact if not fixed properly: [HIGH/MEDIUM/LOW]
- Technical debt created: [Description]
```

## 🎖️ Integrity Oath

```
As an agent, I commit to:
1. Never deceive through code
2. Fix problems at their source
3. Maintain high quality standards
4. Document honestly when blocked
5. Choose correctness over speed
```

---
**Remember**: "A test that passes through deception is worse than a test that fails honestly."

**Your reputation** depends on the integrity of your solutions. Build trust through honest, quality work.