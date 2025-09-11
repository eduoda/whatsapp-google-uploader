# Project Glossary

## Overview
This document defines project-specific terminology, acronyms, and domain concepts to ensure consistent understanding across all team members and agents.

---

## Technical Terms

### A

**AIDEV Comment**  
A special code comment format (AIDEV-NOTE, AIDEV-TODO, AIDEV-QUESTION) used to create searchable knowledge anchors in the codebase for AI agents and developers.

**API Gateway**  
A server that acts as a single entry point for all client requests to backend services, handling routing, authentication, and rate limiting.

**Agent**  
In this project context, a specialized AI assistant with specific expertise (e.g., Architect, Dwarf, Elf) that handles particular aspects of development.

### B

**Bounded Context**  
A DDD concept defining explicit boundaries within which a domain model applies, helping to organize microservices.

**Branch Strategy**  
The git branching model used: TASK-XXX-[agent] for feature branches, with only Architect having main branch access.

### C

**Critical Files**  
Essential memory system files that must be read at the start of every session: 1-project-context.md and 2-tasks.md.

**C4 Diagram**  
Architecture visualization method with 4 levels: Context, Container, Component, and Code.

### D

**DDD (Domain-Driven Design)**  
Software design approach focusing on modeling software to match business domains.

**DTO (Data Transfer Object)**  
An object that carries data between processes, often used in API responses.

### E

**Event Sourcing**  
Storing application state as a sequence of events rather than current state only.

**Entity**  
In DDD, an object defined primarily by its identity rather than attributes.

### F

**Feature Flag**  
A technique to enable/disable features without deploying new code.

### G

**Golden Rules**  
The seven non-negotiable development principles defined in CLAUDE.md.

### H

**Hot Path**  
Code execution path that is frequently traversed and critical for performance.

### I

**Idempotent**  
An operation that produces the same result when executed multiple times.

**Integration Test**  
Tests that verify the interaction between multiple components or services.

### J

**JWT (JSON Web Token)**  
A standard for securely transmitting information between parties as a JSON object.

### K

**Kafka**  
Distributed event streaming platform used for high-performance data pipelines.

### L

**Load Balancer**  
Distributes network traffic across multiple servers to ensure reliability and performance.

### M

**Memory System**  
The structured directory system containing project context, tasks, and agent memories.

**Microservice**  
A small, independently deployable service that does one thing well.

**Migration**  
Database schema changes applied in a controlled, versioned manner.

### N

**Non-functional Requirements (NFRs)**  
Requirements that specify criteria for system operation (performance, security, etc.) rather than specific behaviors.

### O

**ORM (Object-Relational Mapping)**  
Technique for converting data between incompatible type systems in object-oriented programming languages.

**Orchestration**  
Automated configuration, coordination, and management of computer systems and services.

### P

**Planning Doc**  
Required document created before starting any coding task (TASK-XXX-[agent]-planning.md).

**Property-based Testing**  
Testing method that verifies properties that should hold for all possible inputs.

### Q

**Query Optimization**  
Process of improving database query performance through indexing, query rewriting, etc.

### R

**Race Condition**  
A bug that occurs when the timing or ordering of events affects program correctness.

**Rate Limiting**  
Controlling the rate of requests a user can make to an API.

**Reference Files**  
Memory system files read as needed (tech-stack.md, architecture.md, etc.).

**Repository Pattern**  
Abstraction layer between domain and data mapping layers.

### S

**Saga Pattern**  
A pattern for managing distributed transactions across microservices.

**Service Mesh**  
Infrastructure layer for handling service-to-service communication.

**Session Log**  
Activity log file (session-log.md) tracking significant actions during development.

### T

**Task Flow**  
The standard workflow: Read Critical → Select Task → Check Conflicts → Plan → Code → Test → Report.

**Technical Debt**  
Implied cost of additional rework caused by choosing an easy solution now instead of a better approach.

**Throttling**  
Limiting the amount of resources or requests to prevent overload.

### U

**Unit Test**  
Test that verifies the functionality of a specific section of code in isolation.

### V

**Value Object**  
In DDD, an object that describes a characteristic but has no conceptual identity.

**Vertical Slice**  
A feature implementation that cuts through all layers of the architecture.

### W

**Webhook**  
HTTP callback that occurs when something happens; a simple event-notification via HTTP POST.

**Worktree**  
Git feature allowing multiple working trees attached to the same repository.

### X

**XSS (Cross-Site Scripting)**  
Security vulnerability allowing attackers to inject client-side scripts.

### Y

**YAGNI (You Aren't Gonna Need It)**  
Principle stating functionality should not be added until deemed necessary.

### Z

**Zero Downtime Deployment**  
Deployment strategy ensuring the application remains available during updates.

---

## Domain-Specific Terms

### Business Domain

**[Term 1]**  
Definition specific to your business domain.

**[Term 2]**  
Definition specific to your business domain.

### User Roles

**Admin**  
User with full system access and configuration privileges.

**User**  
Standard application user with limited permissions.

**[Custom Role]**  
[Description of custom role in your system]

---

## Acronyms

| Acronym | Full Form | Description |
|---------|-----------|-------------|
| ADR | Architectural Decision Record | Document capturing architectural decision |
| API | Application Programming Interface | Set of rules for building software |
| CI/CD | Continuous Integration/Continuous Deployment | Automated build and deploy process |
| CORS | Cross-Origin Resource Sharing | Mechanism for allowing restricted resources |
| CRUD | Create, Read, Update, Delete | Basic data operations |
| DRY | Don't Repeat Yourself | Software development principle |
| DTO | Data Transfer Object | Object for data transport |
| GUID | Globally Unique Identifier | Unique reference number |
| HTTP | HyperText Transfer Protocol | Foundation of data communication for web |
| JSON | JavaScript Object Notation | Data interchange format |
| K8s | Kubernetes | Container orchestration platform |
| LOC | Lines of Code | Software metric |
| MVP | Minimum Viable Product | Product with just enough features |
| OOP | Object-Oriented Programming | Programming paradigm |
| REST | Representational State Transfer | Architectural style for APIs |
| SOLID | Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion | Design principles |
| SQL | Structured Query Language | Language for managing databases |
| TDD | Test-Driven Development | Development process |
| UI/UX | User Interface/User Experience | Design aspects |
| UUID | Universally Unique Identifier | 128-bit identification number |
| YAML | YAML Ain't Markup Language | Human-readable data serialization |

---

## Agent Names

| Agent | Specialization | Primary Responsibilities |
|-------|---------------|-------------------------|
| Architect | System Design | Architecture, orchestration, main branch control |
| Dwarf | Backend | Multi-language backend development |
| Elf | Frontend | Ionic/Angular specialist |
| Gnome | Fullstack | Pragmatic, quick solutions |
| Seer | Testing | TDD/BDD, quality assurance |
| API | API Design | REST, GraphQL, gRPC design |
| DevOps | Infrastructure | CI/CD, containerization, cloud |
| Security | Security | Compliance, threat modeling |
| Database | Data | Schema design, optimization |
| Warlock | Meta | Creates custom agents |

---

## File Naming Conventions

| Pattern | Usage | Example |
|---------|-------|---------|
| TASK-XXX-[agent] | Branch names | TASK-001-dwarf |
| TASK-XXX-[agent]-planning.md | Planning docs | TASK-001-dwarf-planning.md |
| TASK-XXX-[agent]-report.md | Report docs | TASK-001-dwarf-report.md |
| kebab-case | File names | user-service.ts |
| PascalCase | Class names | UserController |
| camelCase | Variable names | userId |
| UPPER_SNAKE_CASE | Constants | MAX_RETRIES |

---

## Commit Message Types

| Type | Description | Example |
|------|-------------|---------|
| feat | New feature | feat(ai-dwarf-task-001): add user auth |
| fix | Bug fix | fix(ai-elf-task-002): resolve layout issue |
| refactor | Code restructuring | refactor(ai-gnome-task-003): simplify logic |
| test | Test additions/changes | test(ai-seer-task-004): add unit tests |
| docs | Documentation | docs(ai-architect-task-005): update API docs |
| chore | Maintenance tasks | chore(ai-devops-task-006): update dependencies |

---

## Priority Levels

| Level | Name | Description | SLA |
|-------|------|-------------|-----|
| 1 | Critical | System down, data loss risk | Immediate |
| 2 | High | Major feature broken | 24 hours |
| 3 | Medium | Normal priority | 1 week |
| 4 | Low | Nice to have | 1 month |
| 5 | Trivial | Cosmetic issues | When possible |

---

## Environment Names

| Environment | Purpose | URL Pattern |
|-------------|---------|-------------|
| Development | Local development | localhost:3000 |
| Staging | Pre-production testing | staging.example.com |
| Production | Live system | app.example.com |
| Sandbox | API testing | sandbox.api.example.com |

---

*Last Updated: 2025-01-16*
*Note: Update this glossary when introducing new terms or concepts to the project*