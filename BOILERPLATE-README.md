# Claude Code Multi-Agent System Boilerplate 🤖

> Production-ready framework for orchestrated multi-agent AI development with Claude Code

## 🚀 Quick Start

```bash
# Clone boilerplate
git clone <boilerplate-repo> my-project
cd my-project

# Initialize memory system
mkdir -p memory-system/{critical,reference,archive,task-docs/templates,agents}
touch memory-system/critical/{1-project-context.md,2-tasks.md}
touch memory-system/session-log.md

# Copy agent configurations
cp -r .claude/agents/* /your/project/.claude/agents/
```

## 🏗️ Core Components

### Memory System
```
memory-system/
├── critical/         # Must read every session
├── reference/        # Read as needed
├── archive/          # Historical data
├── task-docs/        # Task documentation
└── agents/           # Agent-specific memory
```

### Agent Types
- **Architect** - System design & orchestration
- **Dwarf** - Backend (TypeScript, Python, Go, Java, Rust)
- **Elf** - Frontend (Ionic/Angular specialist)
- **Gnome** - Pragmatic fullstack (20+ years experience)
- **Seer** - Testing & QA
- **API** - API design & documentation
- **DevOps** - Infrastructure & CI/CD
- **Security** - Security & compliance
- **Database** - Data architecture

### Meta Agent
- **Warlock** - Creates custom agents for your project

## 📋 Workflow Protocol

### Golden Rules
1. **NO CODE WITHOUT PLANNING**
2. **DOCUMENT EVERYTHING**
3. **USE AIDEV- COMMENTS**
4. **TEST LEGITIMATELY**
5. **NO WORKAROUNDS**
6. **NO EXTENSIVE CHANGES** (>300 LOC needs approval)
7. **STAY IN CONTEXT**

### Task Flow
```
Read Critical → Select Task → Check Conflicts → Mark IN PROGRESS
→ Create Planning → Setup Branch → Write Code → Test
→ Create Report → Mark COMPLETED → Push Branch
```

### Git Strategy
```
<type>(ai-[agent]-task-XXX): <description>

Examples:
feat(ai-dwarf-task-001): implement auth service
fix(ai-elf-task-002): resolve mobile layout issue
```

## 🎯 Agent Composition Patterns

### Starter Kits

**Full-Stack App**
- Architect + Dwarf + Elf + Seer + API

**Mobile App**
- Elf + API + Database + Seer

**Startup MVP**
- Gnome + Seer + DevOps

**Microservices**
- Architect + DevOps + Seer + Security

## 🔧 Configuration

### 1. Project Context
Edit `memory-system/critical/1-project-context.md`:
```markdown
# Project Context
## Project Name: [Your project]
## Tech Stack: [Your stack]
## Objectives: [Your goals]
```

### 2. CLAUDE.md
Pre-configured with:
- Golden rules
- Agent workflows
- Memory guidelines
- AIDEV comment standards

### 3. Agent Customization
Add custom agents:
1. Update `agent_types` in CLAUDE.md
2. Create `memory-system/agents/[agent]/`
3. Define workflows

## 📝 AIDEV Comments

```python
# AIDEV-NOTE: Critical performance path
# AIDEV-TODO: Implement caching
# AIDEV-QUESTION: Handle edge case?
```

## ✅ Validation Checklist

**Before Starting**
- [ ] Read critical files
- [ ] Check assigned tasks
- [ ] Verify no conflicts
- [ ] Select highest priority

**During Task**
- [ ] Planning doc created
- [ ] Branch created
- [ ] AIDEV comments added
- [ ] Tests passing

**After Completion**
- [ ] Task marked complete
- [ ] Report created
- [ ] Session log updated
- [ ] Branch pushed

## 📊 Memory Limits

| Directory | Max Size | Action if Exceeded |
|-----------|----------|-------------------|
| critical/ | 10 KB | Split or archive |
| reference/ | 50 KB | Split by topic |
| agents/ | 20 KB | Archive old |

## 🚨 Common Pitfalls

| Mistake | Correct Action |
|---------|---------------|
| Skipping planning | Always plan first |
| Modifying tests to pass | Fix the code |
| Multiple tasks in progress | One at a time |
| Forgetting AIDEV comments | Add for complex code |

## 📚 Available Agents Reference

### Core Development
- **Architect**: System design, C4 diagrams, ADRs
- **Seer**: TDD/BDD, property testing, chaos engineering
- **Dwarf**: Multi-language backend, service architecture

### Specialized
- **Database Guru**: Schema design, optimization, migrations
- **DevOps Ninja**: Docker, K8s, Terraform, cloud platforms
- **Security Sentinel**: OWASP, compliance, threat modeling
- **API Craftsman**: REST, GraphQL, gRPC, OpenAPI
- **Elf**: Ionic 7+, Angular 17+, Capacitor, PWAs
- **Node Savant**: TypeScript patterns, functional programming
- **Gnome**: MVPs, rapid prototyping, production fixes

### Meta
- **Warlock**: Research and create custom agents

## 🔄 Maintenance

When updating boilerplate:
1. Test in sample project
2. Update documentation
3. Tag version
4. Document breaking changes

## 📄 License

MIT License

---

> "A test that passes through deception is worse than a test that fails honestly."

**Version**: 2.0  
**For detailed setup**: See full documentation in repository