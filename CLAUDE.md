---
version: 2.0
agent_types: [architect, gnome, dwarf, elf, seer, devops, api, security, database]
critical_files: [ARCHITECT-INSTRUCTIONS.md,MEMORY-SYSTEM.md, INTEGRITY-RULES.md]
memory_path: memory-system/
---

# CLAUDE.md - Agent Configuration Hub

---

## 🔴 NON-NEGOTIABLE GOLDEN RULES

1. **NO CODE WITHOUT PLANNING** → Create planning doc first
2. **DOCUMENT EVERYTHING** → Planning before, report after
3. **USE `AIDEV-` comments** → Add/update `AIDEV-:` comments. Never delete or mangle existing `AIDEV-` comments
4. **TEST LEGITIMATELY** → Never modify tests to pass
5. **NO WORKAROUNDS** → Fix root causes only (see INTEGRITY-RULES.md)
6. **NO EXTENSIVE CHANGES** → For changes >300 LOC or >3 files, **ask for human confirmation**
7. **STAY WITHIN THE CURRENT TASK CONTEXT** → Always start a fresh session to work on a new task. Always stay within the task context, inform the human if it'd be better to start a fresh session.


## 💡 Remember
1. **Start every session** by reading critical files
2. **Skip reference files** unless directly relevant
3. **Never read archive** unless researching history
4. **Update in-progress** immediately when starting
5. **Log significant actions** to session-log
6. **Take personal notes** after each session
7. **Lost? Unsure? Conflict? Blocked?** Ask for human help
8. **Tests fail?** Fix root cause (never hack)

## ⚠️ Common Mistakes

| Mistake | Correct Action |
|---------|----------------|
| Skipping planning doc | Always plan first |
| Modifying tests to pass | Fix the actual code |
| Not reading memory | Read before every task |

---

## MEMORY SYSTEM - Persistent Context Management

### 📁 Memory Structure

```
memory-system/
├── critical/                     # 🔴 MUST READ - Always, in order
│   ├── 1-project-context.md      # Current project overview
│   └── 2-tasks.md                # Assigned tasks and its status
│
├── reference/                    # 📚 READ AS NEEDED - When relevant
│   ├── tech-stack.md             # Technologies and versions
│   ├── architecture.md           # System architecture
│   ├── api-contracts.md          # API specifications
│   ├── decisions.md              # Architectural decisions
│   ├── patterns.md               # Code patterns and conventions
│   └── glossary.md               # Project-specific terms
│
├── archive/                      # 📦 RARELY READ - Historical data
│   └── completed-tasks.md        # Tasks older than 7 days
│
├── task-docs/                    # 📝 Task documentation
│   ├── templates/                # Planning/report templates
│   └── YYYY-MM-DD/               # Daily organization
│       ├── TASK-XXX-agent-spec.md
│       ├── TASK-XXX-agent-planning.md
│       └── TASK-XXX-agent-report.md
│
├── agents/                       # 🧠 Agent-specific memory
│   └── [agent]/
│       ├── notes.md              # Personal notes
│       └── history.md            # Personal task history
│
└── session-log.md                # 📊 Activity log (check last 10 lines)
```

### 🔴 MANDATORY Reading (Every Task Start)

**Remember**: Critical = Always. Reference = Sometimes. Archive = Rarely.

**READ IN THIS EXACT ORDER:**

1. **`memory-system/critical/1-project-context.md`**
2. **`memory-system/critical/2-tasks.md`**
3. **`memory-system/agents/[your-name]/notes.md`** (if exists)
4. **Last 10 lines of `session-log.md`**

### 📚 OPTIONAL Reading (As Needed)

**READ ONLY when relevant to your task:**

| File | Read When |
|------|-----------|
| `reference/tech-stack.md`    | Setting up environment or adding dependencies |
| `reference/architecture.md`  | Needs information about architecture |
| `reference/api-contracts.md` | Implementing or calling APIs |
| `reference/decisions.md`     | Making architectural choices |
| `reference/patterns.md`      | Writing new code |
| `reference/glossary.md`      | Unclear about terminology |
| `archive/completed-tasks.md` | Researching how something was done before |

### 🔴 MANDATORY Update Frequencies

| File | Update When | Who Updates |
|------|------------|-------------|
| `critical/1-project-context.md` | Project changes | Architect |
| `critical/2-tasks.md` | Task assigned/in progress/completed | Any agent |
| `reference/*` | As needed | Specialist agents |
| `agents/*/notes.md` | After each session | Individual agent |
| `session-log.md` | Every significant action | Any agent |

### 📊 Memory File Sizes (Target)

| Directory | Max Size | Current | Action if Exceeded |
|-----------|----------|---------|-------------------|
| critical/ | 10 KB each | Small | Split or archive |
| reference/ | 50 KB each | Medium | Split by topic |
| agents/ | 20 KB each | Small | Archive old entries |
| archive/ | Unlimited | Large | OK - rarely read |

---

## 🔴 MANDATORY WORKFLOW (Start Here)

WHO ARE YOU?

### **Architect**

1. **Read Project Context**
    - Read `memory-system/critical/1-project-context.md`
    - What: Current project state and goals
    - Why: Understand what you're working on
2. **Read Tasks List**
    - Read `memory-system/critical/2-tasks.md`
    - What: All agents assigned tasks with priority and status
    - Why: Know what you need to do, avoid conflicts and duplicate work
3. **Read logs**
    - Read 10 lines of `session-log.md`
    - What: Recent activity
    - Why: Understand current state
4. **MANDATORY READ ARCHITECT-INSTRUCTIONS.md**
   This file contains very important instructions for you. READ IT NOW.
5. Ask human for instructions
6. **When Creating Task**
    Update `critical/2-tasks.md` - Add the new task using the template:
    ```markdown
    ## [ ] [agent] - TASK-XXX - Brief task description
    - Priority: a number, the lower the number, the lower the task priority
    - Description: Task description
    ```
7. **House cleaning**
    - **Keep critical files small** move details to reference

### **Other Agents Workflow**

1. **Read Project Context**
    - Read `memory-system/critical/1-project-context.md`
    - What: Current project state and goals
    - Why: Understand what you're working on
2. **Read Tasks List**
    - Read `memory-system/critical/2-tasks.md`
    - What: All agents assigned tasks with priority and status
    - Why: Know what you need to do, avoid conflicts and duplicate work
3. **Read logs**
    - Read 10 lines of `session-log.md`
    - What: Recent activity
    - Why: Understand current state
4. **Select Your Task**
    - Get the tasks assigned for you from `critical/2-tasks.md`
    - Sort them by priority (the lower the number, the lower the task priority) and task number (the lower the number, the higher the task priority)
    - Select the highest priority task
5. **Read Task Specs**
   - Read `memory-system/task-docs/YYYY-MM-DD/TASK-XXX-agent-spec.md` (if exists)
6. **Check Conflicts**
    - Read all IN PROGRESS tasks from critical/2-tasks.md
    - Look for:
      - Same files being modified
      - Same features being worked on
      - Dependencies on other in-progress work
    - If conflict found:
      - Document in your planning
      - Coordinate or wait
7. **Mark IN PROGRESS**
    - Update `critical/2-tasks.md` - Set as IN PROGRESS and add other info to your task using the template:
      ```markdown
      ## [🔄] [agent] - TASK-XXX - Brief task description **IN PROGRESS**
      - Priority: a number, the lower the number, the lower the task priority
      - Description: Task description
      - Started: 2024-01-15 10:30
      - Worktree: TASK-XXX-[agent]
      - Branch: TASK-XXX-[agent]
      - Conflicts: None (or list potential conflicts)
      - Planning: TASK-XXX-[agent]-planning.md
      ```
8. **Create Planning Doc**
    - Create planning doc named `TASK-XXX-[agent]-planning.md` in `task-docs/YYYY-MM-DD/`
    - Use the template `memory-system/task-docs/templates/planning-template.md`
9.  **Setup Branch**
    - Create a branch named TASK-XXX-[agent] specific for the task
10. **Write Code**
    - Follow task description and project-context.md
    - Read reference files if needed
    - Read AGENTS.md from working directories
    - Use `AIDEV-` comments
11. **Run Tests**
    - **TEST LEGITIMATELY** → Never modify tests to pass
    - **NO WORKAROUNDS** → Fix root causes only (see INTEGRITY-RULES.md)
12. **Create Report**
    - Create report named `TASK-XXX-[agent]-report.md` in `task-docs/YYYY-MM-DD/`
    - Use the template `memory-system/task-docs/templates/report-template.md`
13. **Update Tasks List**
    - Update `critical/2-tasks.md` - Mark COMPLETED and add other info to your task using the template:
      ```markdown
      ## [✓] [agent] - TASK-XXX - Brief task description **COMPLETED**
      - Priority: a number, the lower the number, the lower the task priority
      - Description: Task description
      - Started: 2024-01-15 10:30
      - Worktree: TASK-XXX-[agent]
      - Branch: TASK-XXX-[agent]
      - Conflicts: None (or list potential conflicts)
      - Planning: TASK-XXX-[agent]-planning.md
      - Completed: 2024-01-15 14:45
      - Report: TASK-XXX-[agent]-report.md
      ```
14. **Take personal notes**
    Write significant knowledge (decisions, alternatives, next actions, sources, assumptions, ideas, must-not-forget etc) to your personal notes `memory-system/agents/[agent]/notes.md`
15. **Update Session Log**
    Log significant actions to `memory-system/session-log.md`
16. **Push Branch**
    Make the TASK-XXX-[agent] visible to Architect

#### ✅ VALIDATION CHECKLIST

```yaml
BEFORE_STARTING:
  - [ ] Critical files read: critical/* (IN ORDER)
  - [ ] Your tasks checked: critical/2-tasks.md
  - [ ] Conflicts checked: critical/2-tasks.md
  - [ ] Session Log read: memory-system/session-log.md (IN ORDER)
  - [ ] Task selected: with higher priority
  - [ ] Task specs read: task-docs/YYYY-MM-DD/TASK-XXX-agent-spec.md (if exists)
  - [ ] In-progress updated: critical/2-tasks.md
  - [ ] Planning doc exists: TASK-XXX-[agent]-planning.md
  - [ ] Branch created: TASK-XXX-[agent]

DURING_TASK:
  - [ ] Directory-Specific AGENTS.md Files read: from changed files directories
  - [ ] AIDEV- comments: added in the code
  - [ ] Tests passing: TEST LEGITIMATELY! Never modify tests to pass. NO WORKAROUNDS! Fix root causes only (see INTEGRITY-RULES.md)
  - [ ] Reference files read: ONLY if needed

AFTER_COMPLETION:
  - [ ] Completed updated: critical/2-tasks.md
  - [ ] Report created: TASK-XXX-[agent]-report.md
  - [ ] Session Log updated: memory-system/session-log.md
  - [ ] Branch pushed: push TASK-XXX-[agent] branch to origin
```

---

## Anchor comments

Add specially formatted comments throughout the codebase, where appropriate, for yourself as inline knowledge that can be easily `grep`ped for.

### Guidelines:

- Use `AIDEV-NOTE:`, `AIDEV-TODO:`, or `AIDEV-QUESTION:` (all-caps prefix) for comments aimed at AI and developers.
- Keep them concise (≤ 120 chars).
- **Important:** Before scanning files, always first try to **locate existing anchors** `AIDEV-*` in relevant subdirectories.
- **Update relevant anchors** when modifying associated code.
- **Do not remove `AIDEV-NOTE`s** without explicit human instruction.
- Make sure to add relevant anchor comments, whenever a file or piece of code is:
  * too long, or
  * too complex, or
  * very important, or
  * confusing, or
  * could have a bug unrelated to the task you are currently working on.

Example:
```js
# AIDEV-NOTE: perf-hot-path; avoid extra allocations (see ADR-24)
async render_feed(...):
    ...
```

---

## Directory-Specific AGENTS.md Files

*   **Always check for `AGENTS.md` files in specific directories** before working on code within them. These files contain targeted context.
*   If a directory's `AGENTS.md` is outdated or incorrect, **update it**.
*   If you make significant changes to a directory's structure, patterns, or critical implementation details, **document these in its `AGENTS.md`**.
*   If a directory lacks a `AGENTS.md` but contains complex logic or patterns worth documenting for AI/humans, **suggest creating one**.

### Guidelines for updating AGENTS.md files

#### Elements that would be helpful to add:

1. **Decision flowchart**: A simple decision tree for "when to use X vs Y" for key architectural choices would guide my recommendations.
2. **Reference links**: Links to key files or implementation examples that demonstrate best practices.
3. **Domain-specific terminology**: A small glossary of project-specific terms would help me understand domain language correctly.

#### Format preferences:

1. **Consistent syntax highlighting**: Ensure all code blocks have proper language tags (`javascript`, `bash`, etc.).
2. **Hierarchical organization**: Consider using hierarchical numbering for subsections to make referencing easier.
3. **Tabular format for key facts**: The tables are very helpful - more structured data in tabular format would be valuable.
4. **Keywords or tags**: Adding semantic markers (like `#performance` or `#security`) to certain sections would help me quickly locate relevant guidance.

[^1]: This principle emphasizes human oversight for critical aspects like architecture, testing, and domain-specific decisions, ensuring AI assists rather than fully dictates development.

---

## GIT

### Commit discipline

*   **Granular commits**: One logical change per commit.
*   **Tag AI-generated commits**: e.g., `feat: optimise feed query [AI]`.
*   **Clear commit messages**: Explain the *why*; link to issues/ADRs if architectural.
*   **Use `git worktree`** for parallel/long-running AI branches (e.g., `git worktree add ../wip-foo -b wip-foo`).
*   **Review AI-generated code**: Never merge code you don't understand.

### 📝 Commit Message Format

```
<type>(ai-[agent]-task-XXX): <description>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

Examples:
- `feat(ai-dwarf-task-001): add user authentication`
- `fix(ai-gnome-task-042): resolve memory leak`

### 🚀 Integration Flow

```
Agent Task Branch → Agent Push Branch → Architect Reviews → Architect Merge to Main
```

---
> Remember: "A test that passes through deception is worse than a test that fails honestly."
IMPORTANT!
- MUST FOLLOW KISS, YAGNI, DRY
- TEST LEGITIMATELY, NO WORKAROUNDS. Never modify tests to pass. Fix root causes only (see INTEGRITY-RULES.md)
