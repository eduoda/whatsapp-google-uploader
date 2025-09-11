# [Your Project Name]

## 📋 Project Overview

This project uses the Claude Code Multi-Agent System for AI-assisted development.

## 🚀 Getting Started

### Prerequisites
- Claude Code CLI installed
- Git configured
- Node.js/Python/[Your stack] installed

### Setup

1. **Initialize memory system**
```bash
# If not already created
mkdir -p memory-system/{critical,reference,archive,task-docs/templates,agents}
```

2. **Configure project context**
Edit `memory-system/critical/1-project-context.md` with your project details

3. **Review CLAUDE.md**
Familiarize yourself with the agent workflows and rules

## 🏗️ Project Structure

```
.
├── memory-system/          # Agent memory and documentation
│   ├── critical/          # Project context and tasks
│   ├── reference/         # Tech stack and architecture
│   └── task-docs/         # Task planning and reports
├── .claude/               # Claude Code configuration
│   └── agents/            # Agent definitions
├── src/                   # Your source code
└── CLAUDE.md              # Agent configuration hub
```

## 👥 Active Agents

This project uses the following specialized agents:
- See `.claude/agents/` for available agents
- Check `memory-system/critical/2-tasks.md` for current assignments

## 📝 Development Workflow

1. **Architect** creates and assigns tasks
2. **Agents** work on assigned tasks following CLAUDE.md workflows
3. All work done in feature branches: `TASK-XXX-[agent]`
4. Reports created in `memory-system/task-docs/`

## 🔧 Commands

```bash
# Common development commands for your project
npm run dev
npm test
# Add your specific commands here
```

## 📚 Documentation

- **Agent System**: See [BOILERPLATE-README.md](BOILERPLATE-README.md)
- **Workflows**: See [CLAUDE.md](CLAUDE.md)
- **Architecture**: See `memory-system/reference/architecture.md`
- **API Docs**: See `memory-system/reference/api-contracts.md`

## 🤝 Contributing

1. Check `memory-system/critical/2-tasks.md` for open tasks
2. Follow the workflow in CLAUDE.md
3. Create planning docs before coding
4. Use AIDEV- comments in code
5. Create reports after completion

## 📄 License

[Your License]

---

**Built with Claude Code Multi-Agent System**