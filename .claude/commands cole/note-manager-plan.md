# Feature: obsidian_note_manager Tool Implementation

The following plan is complete and ready for implementation. Validate documentation, codebase patterns, and task sanity before implementing. Pay special attention to naming of existing utils, types, and models. Import from the correct files.

## Feature Description

Implement the `obsidian_manage_note` tool, providing complete note lifecycle management for Obsidian vaults through natural language commands. This tool consolidates create, read, update, append, delete, and metadata operations into a single, workflow-optimized interface following Anthropic's tool design best practices. The implementation mirrors the successful patterns established in the `obsidian_query_vault` tool, maintaining consistency in logging, VSA architecture, file naming, and testing approaches.

## User Story

As an Obsidian vault user interacting with Paddy AI agent
I want to manage my notes using natural language commands
So that I can efficiently create, read, update, and organize notes without manual file operations

## Problem Statement

Users need to perform various note operations (creating daily notes, updating project status, appending meeting notes, managing metadata) but currently lack the ability to modify vault content through the AI agent. While the existing `obsidian_query_vault` tool enables discovery and search, users cannot act on findings without switching to manual Obsidian operations. This breaks workflow continuity and reduces the agent's utility for active vault management.

## Solution Statement

Build a consolidated `obsidian_manage_note` tool that handles all note modification operations through a single interface with operation-specific parameters. The tool will:

- Provide CRUD operations (create, read, update, append, delete) in one tool
- Support batch operations for efficient multi-note updates
- Ensure safe operations with confirmation requirements for destructive actions
- Mirror the proven patterns from `obsidian_query_vault` for consistency
- Return structured, actionable results with clear success/failure indicators

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**:

- Agent tooling (new feature slice)
- Vault file system operations (new writer utilities)
- Tool registry (registration of new tool)

**Dependencies**:

- Pydantic AI (already integrated)
- Existing vault infrastructure (`vault_reader.py`, `vault_parser.py`, `vault_validator.py`, `vault_exceptions.py`)
- New: `vault_writer.py` for write operations

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `app/features/obsidian_query_vault/obsidian_query_vault_tool.py` (lines 1-184) - Why: Agent-optimized docstring pattern, error handling, logging structure
- `app/features/obsidian_query_vault/obsidian_query_vault_service.py` (lines 1-161) - Why: Service layer orchestration pattern, operation routing
- `app/features/obsidian_query_vault/obsidian_query_vault_models.py` (lines 1-81) - Why: Pydantic model structure with Field descriptions and validation
- `app/features/obsidian_query_vault/operations/obsidian_query_vault_search_operation.py` (lines 1-62) - Why: Operation file structure, async pattern, error handling
- `app/shared/vault/vault_reader.py` (lines 1-159) - Why: File reading patterns, NoteMetadata class, validation usage
- `app/shared/vault/vault_parser.py` (lines 1-97) - Why: Frontmatter parsing, tag extraction, title extraction
- `app/shared/vault/vault_validator.py` (lines 1-70) - Why: Path validation and security checks
- `app/shared/vault/vault_exceptions.py` (lines 1-42) - Why: Custom exception hierarchy for vault operations
- `app/core/agents/tool_registry.py` (lines 1-97) - Why: Tool registration pattern, agent import
- `app/features/obsidian_query_vault/tests/test_obsidian_query_vault_integration.py` (lines 1-50) - Why: Integration test structure with fixtures

### New Files to Create

- `app/shared/vault/vault_writer.py` - Low-level write operations for notes (create, update, append, delete)
- `app/features/obsidian_manage_note/obsidian_manage_note_tool.py` - Pydantic AI tool with agent-optimized docstring
- `app/features/obsidian_manage_note/obsidian_manage_note_service.py` - Service orchestration for note operations
- `app/features/obsidian_manage_note/obsidian_manage_note_models.py` - Type-safe Pydantic models for inputs/outputs
- `app/features/obsidian_manage_note/operations/obsidian_manage_note_create_operation.py` - Note creation logic
- `app/features/obsidian_manage_note/operations/obsidian_manage_note_read_operation.py` - Note reading logic (may reuse reader)
- `app/features/obsidian_manage_note/operations/obsidian_manage_note_update_operation.py` - Note update/replace logic
- `app/features/obsidian_manage_note/operations/obsidian_manage_note_append_operation.py` - Content appending logic
- `app/features/obsidian_manage_note/operations/obsidian_manage_note_delete_operation.py` - Note deletion logic
- `app/features/obsidian_manage_note/operations/obsidian_manage_note_metadata_operation.py` - Frontmatter metadata updates
- `app/features/obsidian_manage_note/tests/test_obsidian_manage_note_integration.py` - Integration tests
- `app/features/obsidian_manage_note/tests/test_obsidian_manage_note_service.py` - Service unit tests
- `app/shared/vault/tests/test_vault_writer.py` - Writer utility unit tests

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Pydantic AI Tools](https://ai.pydantic.dev/tools/)
  - Specific section: Tool decorators, RunContext, dependencies
  - Why: Required for implementing `@agent.tool` pattern
- `.agents/docs/mvp-tool-designs.md` (lines 173-354)
  - Specific section: `obsidian_manage_note` specification
  - Why: Complete tool design with all operations and parameters
- `.agents/docs/adding_tools_guide.md` (lines 1-831)
  - Specific section: Agent-optimized docstrings, type-safe arguments, logging, error handling
  - Why: Critical patterns for tool implementation
- `CLAUDE.md` (lines 1-end)
  - Specific section: VSA architecture, logging patterns, type safety rules
  - Why: Project standards and conventions

### Patterns to Follow

**Naming Conventions:**

```python
# Feature directory structure (mirror query_vault)
app/features/obsidian_manage_note/
├── obsidian_manage_note_tool.py      # Tool with @agent.tool decorator
├── obsidian_manage_note_service.py   # Service orchestration
├── obsidian_manage_note_models.py    # Pydantic models
├── operations/                        # Operation implementations
│   ├── obsidian_manage_note_create_operation.py
│   ├── obsidian_manage_note_read_operation.py
│   ├── obsidian_manage_note_update_operation.py
│   ├── obsidian_manage_note_append_operation.py
│   ├── obsidian_manage_note_delete_operation.py
│   └── obsidian_manage_note_metadata_operation.py
└── tests/
    ├── test_obsidian_manage_note_integration.py
    └── test_obsidian_manage_note_service.py

# Shared utilities
app/shared/vault/
└── vault_writer.py  # NEW - write operations
```

**Error Handling Pattern:**

```python
# From obsidian_query_vault_tool.py:129-149
try:
    service = ObsidianManageNoteService(vault_path=ctx.deps.vault_path)
    result = await service.execute(args)

    logger.info(
        "agent.tool.execution_completed",
        tool_name="obsidian_manage_note",
        operation=args.operation,
        affected_notes=result.total_affected,
    )

    return result.model_dump_json(exclude_none=True)

except VaultError as e:
    logger.error(
        "agent.tool.execution_failed",
        tool_name="obsidian_manage_note",
        operation=args.operation,
        error=str(e),
        error_type=type(e).__name__,
        exc_info=True,
    )

    error_response = {
        "success": False,
        "error": str(e),
        "suggestion": "Check vault path and permissions",
        "alternatives": ["Verify note path", "Check operation parameters"],
    }
    return json.dumps(error_response)
```

**Logging Pattern:**

```python
# From obsidian_query_vault_tool.py:106-112 and 118-125
# START: Include tool_name, operation, key parameters
logger.info(
    "agent.tool.execution_started",
    tool_name="obsidian_manage_note",
    operation=args.operation,
    note_title=args.note_title,
    note_path=args.note_path,
)

# COMPLETE: Include results and metrics
logger.info(
    "agent.tool.execution_completed",
    tool_name="obsidian_manage_note",
    operation=args.operation,
    affected_notes=result.total_affected,
)

# FAILED: Include error details with exc_info=True
logger.error(
    "agent.tool.execution_failed",
    tool_name="obsidian_manage_note",
    operation=args.operation,
    error=str(e),
    error_type=type(e).__name__,
    exc_info=True,
)
```

**Service Orchestration Pattern:**

```python
# From obsidian_query_vault_service.py:25-161
class ObsidianManageNoteService:
    """Business logic for note management operations."""

    def __init__(self, vault_path: Path) -> None:
        """Initialize service with vault path."""
        self.vault_path = vault_path

    async def execute(self, args: ObsidianManageNoteArgs) -> ManageNoteResult:
        """Execute operation based on type.

        Routes to appropriate operation handler:
        - create -> create_operation
        - read -> read_operation
        - update -> update_operation
        - append -> append_operation
        - delete -> delete_operation
        - update_metadata -> metadata_operation
        """
        logger.info(
            "manage_note.service.started",
            operation=args.operation,
            note_title=args.note_title,
        )

        # Route to operation
        if args.operation == "create":
            if not args.note_title:
                raise ValueError("note_title required for create operation")
            result = await create_operation.create_note(...)
        elif args.operation == "read":
            ...
        # ... etc

        logger.info(
            "manage_note.service.completed",
            operation=args.operation,
            affected_notes=len(result.affected_notes),
        )

        return result
```

**Pydantic Model Pattern:**

```python
# From obsidian_query_vault_models.py:11-60
class ObsidianManageNoteArgs(BaseModel):
    """Type-safe arguments for obsidian_manage_note tool."""

    operation: Literal["create", "read", "update", "append", "delete", "update_metadata"] = Field(
        ..., description="Type of note operation to perform"
    )
    note_title: str | None = Field(
        None, description="Note title for single-note operations"
    )
    note_path: str | None = Field(
        None, description="Alternative: explicit path from vault root"
    )
    content: str | None = Field(
        None, description="Content for create/update/append operations"
    )
    # ... more fields with clear descriptions

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "operation": "create",
                "note_title": "Daily Note 2025-01-31",
                "folder_path": "daily",
                "content": "# 2025-01-31\n\n## Tasks\n\n- [ ] Task 1",
            }]
        }
    }

class ManageNoteResult(BaseModel):
    """Response from note management operations."""

    success: bool = Field(..., description="Operation success status")
    operation: str = Field(..., description="Operation performed")
    affected_notes: list[AffectedNote] = Field(..., description="Notes modified")
    total_affected: int = Field(..., ge=0, description="Count of affected notes")
    summary: str = Field(..., description="Human-readable result description")
```

**Agent-Optimized Docstring Pattern:**

```python
# From obsidian_query_vault_tool.py:29-104
@agent.tool
async def obsidian_manage_note(
    ctx: RunContext[AgentDependencies],
    args: ObsidianManageNoteArgs,
) -> str:
    """Manage Obsidian note lifecycle with create, read, update, append, and delete operations.

    Use this when you need to:
    - Create new notes with specific content or from templates
    - Read the full content of a known note
    - Update or replace note content
    - Append content to end of existing notes
    - Delete notes from vault
    - Modify frontmatter metadata

    Do NOT use this for:
    - Finding notes (use obsidian_query_vault with operation='search')
    - Listing notes in a folder (use obsidian_query_vault with operation='list')
    - Discovering backlinks (use obsidian_query_vault with operation='backlinks')
    - Batch operations on filtered notes (use batch_mode=True with this tool)

    Args:
        ctx: Runtime context with agent dependencies (vault_path).
        args: Operation arguments validated by ObsidianManageNoteArgs.
            operation: Type of operation ('create', 'read', 'update', 'append', 'delete', 'update_metadata')
            note_title: Note title for operations (e.g., "Project Plan")
            note_path: Alternative explicit path (e.g., "projects/plan.md")
            content: Content for create/update/append operations
            folder_path: Where to create note (default: vault root)
            confirm_deletion: Required True for delete operations (safety)
            response_format: 'concise' or 'detailed' for read operations

    Returns:
        JSON string containing ManageNoteResult with success status,
        affected_notes array, total_affected count, and summary.

    Performance Notes:
        - Single operations: 50-200ms execution time
        - Batch operations: 100-500ms depending on count
        - Always use concise format unless full content needed
        - Deletion requires explicit confirmation for safety

    Examples:
        # Create new daily note
        obsidian_manage_note(args=ObsidianManageNoteArgs(
            operation="create",
            note_title="2025-01-31",
            folder_path="daily",
            content="# 2025-01-31\n\n## Tasks\n\n"
        ))

        # Read note content
        obsidian_manage_note(args=ObsidianManageNoteArgs(
            operation="read",
            note_title="Project Plan",
            response_format="detailed"
        ))

        # Append to existing note
        obsidian_manage_note(args=ObsidianManageNoteArgs(
            operation="append",
            note_title="Meeting Notes",
            content="\n## 3:00 PM - Follow-up\n\n- Discussed API changes"
        ))
    """
```

---

## IMPLEMENTATION PLAN

### Foundation

Set up the foundational infrastructure for note management, including the vault writer utility and the feature directory structure following VSA patterns.

**Tasks:**

- Create `app/features/obsidian_manage_note/` directory structure
- Implement `app/shared/vault/vault_writer.py` with low-level write operations
- Define Pydantic models in `obsidian_manage_note_models.py`
- Set up operations directory structure

### Core Implementation

Implement the service layer orchestration and individual operation handlers for each note management operation type.

**Tasks:**

- Implement `ObsidianManageNoteService` for operation routing
- Create operation handlers (create, read, update, append, delete, metadata)
- Implement batch operation support in operations
- Add safety checks and validations

### Integration

Connect the new tool to the agent system and ensure proper registration with the tool registry.

**Tasks:**

- Implement `obsidian_manage_note_tool.py` with `@agent.tool` decorator
- Register tool in `app/core/agents/tool_registry.py`
- Update system prompt in tool_registry.py to include new tool
- Verify tool appears in agent's available tools

### Testing & Validation

Create comprehensive test coverage for all operations and validate the complete feature implementation.

**Tasks:**

- Implement integration tests with temp vault fixtures
- Create service unit tests for each operation
- Add vault_writer unit tests
- Test error handling and edge cases
- Validate type checking passes (mypy, pyright)

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### CREATE app/shared/vault/vault_writer.py

- **IMPLEMENT**: VaultWriter class with methods: write_note(), append_to_note(), delete_note(), update_frontmatter()
- **PATTERN**: Mirror VaultReader class structure from vault_reader.py:51-159
- **IMPORTS**:
  ```python
  from datetime import datetime, UTC
  from pathlib import Path
  from typing import Any
  from app.core.logging import get_logger
  from app.shared.vault.vault_exceptions import VaultAccessError, InvalidPathError, NoteNotFoundError
  from app.shared.vault.vault_validator import VaultValidator
  from app.shared.vault.vault_parser import VaultParser
  ```
- **GOTCHA**: Use VaultValidator to prevent directory traversal attacks. Always validate paths before writing.
- **VALIDATE**: `uv run mypy app/shared/vault/vault_writer.py && uv run pyright app/shared/vault/vault_writer.py`

### CREATE app/shared/vault/tests/test_vault_writer.py

- **IMPLEMENT**: Unit tests for VaultWriter methods using tmp_path fixtures
- **PATTERN**: Follow test structure from test_vault_reader.py with pytest fixtures
- **IMPORTS**:
  ```python
  from pathlib import Path
  import pytest
  from app.shared.vault.vault_writer import VaultWriter
  from app.shared.vault.vault_exceptions import VaultAccessError, InvalidPathError
  ```
- **GOTCHA**: Tests should create temp directories and clean up. Use pytest's tmp_path fixture.
- **VALIDATE**: `uv run pytest app/shared/vault/tests/test_vault_writer.py -v`

### CREATE app/features/obsidian_manage_note/**init**.py

- **IMPLEMENT**: Empty init file for package
- **PATTERN**: No pattern needed - standard Python package init
- **IMPORTS**: None
- **GOTCHA**: Must exist for Python to treat directory as package
- **VALIDATE**: File exists, no syntax errors

### CREATE app/features/obsidian_manage_note/operations/**init**.py

- **IMPLEMENT**: Empty init file for operations subpackage
- **PATTERN**: No pattern needed
- **IMPORTS**: None
- **GOTCHA**: Must exist for Python to treat directory as package
- **VALIDATE**: File exists, no syntax errors

### CREATE app/features/obsidian_manage_note/tests/**init**.py

- **IMPLEMENT**: Empty init file for tests subpackage
- **PATTERN**: No pattern needed
- **IMPORTS**: None
- **GOTCHA**: Must exist for pytest to discover tests
- **VALIDATE**: File exists, no syntax errors

### CREATE app/features/obsidian_manage_note/obsidian_manage_note_models.py

- **IMPLEMENT**: Pydantic models: ObsidianManageNoteArgs, AffectedNote, ManageNoteResult
- **PATTERN**: Follow structure from obsidian_query_vault_models.py:11-81
- **IMPORTS**:
  ```python
  from typing import Any, Literal
  from pydantic import BaseModel, Field
  ```
- **GOTCHA**: Include json_schema_extra with examples. Use clear Field descriptions for LLM clarity.
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_note/obsidian_manage_note_models.py && uv run pyright app/features/obsidian_manage_note/obsidian_manage_note_models.py`

### CREATE app/features/obsidian_manage_note/operations/obsidian_manage_note_create_operation.py

- **IMPLEMENT**: async function create_note(vault_path, note_title, folder_path, content, template) -> NoteMetadata
- **PATTERN**: Follow operation structure from obsidian_query_vault_search_operation.py:11-62
- **IMPORTS**:
  ```python
  from pathlib import Path
  from app.core.logging import get_logger
  from app.shared.vault.vault_writer import VaultWriter
  from app.shared.vault.vault_reader import NoteMetadata
  from app.shared.vault.vault_exceptions import VaultError
  ```
- **GOTCHA**: Check if file exists before creating. Use vault_writer.write_note(). Log with "manage_note.create_started/completed/failed".
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_note/operations/obsidian_manage_note_create_operation.py && uv run pyright app/features/obsidian_manage_note/operations/obsidian_manage_note_create_operation.py`

### CREATE app/features/obsidian_manage_note/operations/obsidian_manage_note_read_operation.py

- **IMPLEMENT**: async function read_note(vault_path, note_title, note_path) -> NoteMetadata
- **PATTERN**: Use VaultReader.read_note() from vault_reader.py:66-128
- **IMPORTS**:
  ```python
  from pathlib import Path
  from app.core.logging import get_logger
  from app.shared.vault.vault_reader import VaultReader, NoteMetadata
  ```
- **GOTCHA**: This operation can reuse VaultReader directly. Handle note_title vs note_path resolution.
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_note/operations/obsidian_manage_note_read_operation.py && uv run pyright app/features/obsidian_manage_note/operations/obsidian_manage_note_read_operation.py`

### CREATE app/features/obsidian_manage_note/operations/obsidian_manage_note_update_operation.py

- **IMPLEMENT**: async function update_note(vault_path, note_title, note_path, content, update_mode, target_heading) -> NoteMetadata
- **PATTERN**: Follow async operation pattern from search_operation.py
- **IMPORTS**:
  ```python
  from pathlib import Path
  from app.core.logging import get_logger
  from app.shared.vault.vault_writer import VaultWriter
  from app.shared.vault.vault_reader import VaultReader, NoteMetadata
  ```
- **GOTCHA**: For update_mode='replace', use write_note(). For 'merge', read existing content and merge. Handle target_heading for section-specific updates.
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_note/operations/obsidian_manage_note_update_operation.py && uv run pyright app/features/obsidian_manage_note/operations/obsidian_manage_note_update_operation.py`

### CREATE app/features/obsidian_manage_note/operations/obsidian_manage_note_append_operation.py

- **IMPLEMENT**: async function append_to_note(vault_path, note_title, note_path, content, create_if_missing) -> NoteMetadata
- **PATTERN**: Follow async operation pattern
- **IMPORTS**:
  ```python
  from pathlib import Path
  from app.core.logging import get_logger
  from app.shared.vault.vault_writer import VaultWriter
  from app.shared.vault.vault_reader import NoteMetadata
  ```
- **GOTCHA**: Use vault_writer.append_to_note(). If create_if_missing=True and note doesn't exist, create it first. Log appropriately.
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_note/operations/obsidian_manage_note_append_operation.py && uv run pyright app/features/obsidian_manage_note/operations/obsidian_manage_note_append_operation.py`

### CREATE app/features/obsidian_manage_note/operations/obsidian_manage_note_delete_operation.py

- **IMPLEMENT**: async function delete_note(vault_path, note_title, note_path, confirm_deletion) -> dict[str, Any]
- **PATTERN**: Follow async operation pattern with safety check
- **IMPORTS**:
  ```python
  from pathlib import Path
  from typing import Any
  from app.core.logging import get_logger
  from app.shared.vault.vault_writer import VaultWriter
  from app.shared.vault.vault_exceptions import VaultError
  ```
- **GOTCHA**: MUST check confirm_deletion=True before proceeding. Raise ValueError if False. Log deletion with warning level.
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_note/operations/obsidian_manage_note_delete_operation.py && uv run pyright app/features/obsidian_manage_note/operations/obsidian_manage_note_delete_operation.py`

### CREATE app/features/obsidian_manage_note/operations/obsidian_manage_note_metadata_operation.py

- **IMPLEMENT**: async function update_metadata(vault_path, note_title, note_path, metadata_field, metadata_value, metadata_operation) -> NoteMetadata
- **PATTERN**: Follow async operation pattern with frontmatter manipulation
- **IMPORTS**:
  ```python
  from pathlib import Path
  from typing import Any
  from app.core.logging import get_logger
  from app.shared.vault.vault_writer import VaultWriter
  from app.shared.vault.vault_reader import VaultReader, NoteMetadata
  from app.shared.vault.vault_parser import VaultParser
  ```
- **GOTCHA**: Parse existing frontmatter, apply metadata_operation ('set', 'append', 'remove'), then rewrite note. Use VaultParser.parse_frontmatter().
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_note/operations/obsidian_manage_note_metadata_operation.py && uv run pyright app/features/obsidian_manage_note/operations/obsidian_manage_note_metadata_operation.py`

### CREATE app/features/obsidian_manage_note/obsidian_manage_note_service.py

- **IMPLEMENT**: ObsidianManageNoteService class with execute() method routing to operations
- **PATTERN**: Mirror ObsidianQueryVaultService from obsidian_query_vault_service.py:25-161
- **IMPORTS**:
  ```python
  from pathlib import Path
  from app.core.logging import get_logger
  from app.features.obsidian_manage_note.obsidian_manage_note_models import (
      ObsidianManageNoteArgs,
      ManageNoteResult,
      AffectedNote,
  )
  from app.features.obsidian_manage_note.operations import (
      obsidian_manage_note_create_operation,
      obsidian_manage_note_read_operation,
      obsidian_manage_note_update_operation,
      obsidian_manage_note_append_operation,
      obsidian_manage_note_delete_operation,
      obsidian_manage_note_metadata_operation,
  )
  ```
- **GOTCHA**: Validate required parameters for each operation (e.g., note_title for create, confirm_deletion=True for delete). Convert operation results to ManageNoteResult.
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_note/obsidian_manage_note_service.py && uv run pyright app/features/obsidian_manage_note/obsidian_manage_note_service.py`

### CREATE app/features/obsidian_manage_note/obsidian_manage_note_tool.py

- **IMPLEMENT**: Tool function with @agent.tool decorator, agent-optimized docstring, error handling
- **PATTERN**: Mirror obsidian_query_vault_tool.py:24-184 structure exactly
- **IMPORTS**:
  ```python
  import json
  from pydantic_ai import RunContext
  from app.core.agents.tool_registry import agent
  from app.core.agents.types import AgentDependencies
  from app.core.logging import get_logger
  from app.features.obsidian_manage_note.obsidian_manage_note_models import (
      ObsidianManageNoteArgs,
  )
  from app.features.obsidian_manage_note.obsidian_manage_note_service import (
      ObsidianManageNoteService,
  )
  from app.shared.vault.vault_exceptions import VaultError
  ```
- **GOTCHA**: CRITICAL - Write comprehensive agent-optimized docstring following .agents/docs/adding_tools_guide.md:89-156 template. Include "Use this when", "Do NOT use", Performance Notes, and realistic Examples. Log with "agent.tool.execution_started/completed/failed". Return error_response dict as JSON for failures.
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_note/obsidian_manage_note_tool.py && uv run pyright app/features/obsidian_manage_note/obsidian_manage_note_tool.py`

### UPDATE app/core/agents/tool_registry.py

- **IMPLEMENT**: Import obsidian_manage_note_tool in register_tools() function, update PADDY_SYSTEM_PROMPT to include new tool
- **PATTERN**: Add import on line 85 following existing pattern, update system prompt lines 16-34
- **IMPORTS**:
  ```python
  from app.features.obsidian_manage_note import obsidian_manage_note_tool  # noqa: F401
  ```
- **GOTCHA**: Add import in register_tools() function after existing query_vault import. Update system prompt to describe obsidian_manage_note operations. Don't modify agent creation logic.
- **VALIDATE**: `uv run mypy app/core/agents/tool_registry.py && uv run pyright app/core/agents/tool_registry.py`

### CREATE app/features/obsidian_manage_note/tests/test_obsidian_manage_note_service.py

- **IMPLEMENT**: Unit tests for ObsidianManageNoteService with mocked operations
- **PATTERN**: Follow test structure from test_obsidian_query_vault_service.py if exists, or create from integration test pattern
- **IMPORTS**:
  ```python
  from pathlib import Path
  import pytest
  from app.features.obsidian_manage_note.obsidian_manage_note_models import ObsidianManageNoteArgs
  from app.features.obsidian_manage_note.obsidian_manage_note_service import ObsidianManageNoteService
  ```
- **GOTCHA**: Use tmp_path fixtures. Test each operation type. Verify error handling for missing parameters.
- **VALIDATE**: `uv run pytest app/features/obsidian_manage_note/tests/test_obsidian_manage_note_service.py -v`

### CREATE app/features/obsidian_manage_note/tests/test_obsidian_manage_note_integration.py

- **IMPLEMENT**: Integration tests with real vault operations using tmp_path
- **PATTERN**: Mirror test_obsidian_query_vault_integration.py:15-50 structure
- **IMPORTS**:
  ```python
  from pathlib import Path
  import pytest
  from app.features.obsidian_manage_note.obsidian_manage_note_models import ObsidianManageNoteArgs
  from app.features.obsidian_manage_note.obsidian_manage_note_service import ObsidianManageNoteService
  ```
- **GOTCHA**: Mark with @pytest.mark.integration. Test create, read, update, append, delete operations. Verify files are actually created/modified/deleted.
- **VALIDATE**: `uv run pytest app/features/obsidian_manage_note/tests/test_obsidian_manage_note_integration.py -v -m integration`

### RUN Complete Type Checking

- **IMPLEMENT**: Run mypy and pyright on entire app/ directory
- **PATTERN**: Standard type checking validation
- **IMPORTS**: None (command execution)
- **GOTCHA**: Must pass with zero errors in strict mode. Fix any type errors before proceeding.
- **VALIDATE**: `uv run mypy app/ && uv run pyright app/`

### RUN Complete Test Suite

- **IMPLEMENT**: Run full pytest suite including integration tests
- **PATTERN**: Standard test execution
- **IMPORTS**: None (command execution)
- **GOTCHA**: All tests must pass. Integration tests require valid vault path.
- **VALIDATE**: `uv run pytest -v`

### RUN Linting and Formatting

- **IMPLEMENT**: Run ruff check and format
- **PATTERN**: Standard linting validation
- **IMPORTS**: None (command execution)
- **GOTCHA**: Must pass with zero errors. Auto-fix with `ruff format .` if needed.
- **VALIDATE**: `uv run ruff check . && uv run ruff format .`

---

## TESTING STRATEGY

Testing approach based on project's pytest framework with async support and integration test markers.

### Unit Tests

Design unit tests with tmp_path fixtures and assertions following existing testing approaches:

- Test VaultWriter methods independently (write, append, delete, update_frontmatter)
- Test each operation handler with mocked vault utilities
- Test service routing logic with mocked operations
- Test Pydantic model validation with valid and invalid inputs
- Test error handling paths with exception raising

**Scope:**

- All vault_writer.py methods
- All operation handlers in operations/
- Service execute() method routing
- Model validation edge cases

**Requirements:**

- Use pytest-asyncio for async tests
- Use tmp_path fixture for file system operations
- Mock external dependencies when appropriate
- Verify logging calls are made correctly

### Integration Tests

Integration tests marked with @pytest.mark.integration:

- Test complete tool execution flow from args to result
- Test actual file creation, reading, updating, deletion
- Test with real vault directory structure (tmp_path)
- Verify frontmatter parsing and writing
- Test error scenarios with invalid paths and missing notes

**Scope:**

- Complete service execution with real file operations
- End-to-end tool invocation (may require agent context mocking)
- Multi-operation workflows (create then update, read then append)

**Requirements:**

- Mark with @pytest.mark.integration
- Use tmp_path to create test vault
- Clean up test files after execution
- Verify actual file system changes

### Edge Cases

Specific edge cases that must be tested:

- **Path Validation**: Directory traversal attempts (../, absolute paths)
- **Deletion Safety**: Attempting delete without confirm_deletion=True
- **Missing Notes**: Operations on non-existent notes
- **Invalid Operations**: Wrong parameters for operation types
- **Frontmatter Edge Cases**: Empty frontmatter, malformed YAML, missing fields
- **Content Boundaries**: Empty content, very large content (10MB+)
- **Concurrent Access**: Multiple operations on same note (if applicable)
- **Special Characters**: Note titles with special characters, unicode

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
# Format code
uv run ruff format .

# Check linting
uv run ruff check .
```

### Level 2: Type Checking

```bash
# MyPy strict mode
uv run mypy app/

# Pyright strict mode
uv run pyright app/
```

### Level 3: Unit Tests

```bash
# Run all unit tests (excluding integration)
uv run pytest -v -m "not integration"

# Run specific module tests
uv run pytest -v app/shared/vault/tests/test_vault_writer.py
uv run pytest -v app/features/obsidian_manage_note/tests/test_obsidian_manage_note_service.py
```

### Level 4: Integration Tests

```bash
# Run integration tests only
uv run pytest -v -m integration

# Run specific integration tests
uv run pytest -v app/features/obsidian_manage_note/tests/test_obsidian_manage_note_integration.py -m integration
```

### Level 5: Manual Validation

Test tool execution with real agent:

```bash
# Start dev server
uv run uvicorn app.main:app --reload --port 8123

# In separate terminal, test with curl or Obsidian Copilot:
# - Create a test note
# - Read the note back
# - Update note content
# - Append to note
# - Update metadata
# - Delete note (with confirmation)
```

Manual test cases:

1. Create daily note with template content
2. Read project note with detailed format
3. Append meeting notes to existing note
4. Update frontmatter tags on multiple notes (if batch implemented)
5. Delete temporary note with confirmation
6. Verify error handling for missing notes
7. Verify path validation prevents traversal attacks

---

## ACCEPTANCE CRITERIA

- [ ] Feature implements all 6 note operations (create, read, update, append, delete, update_metadata)
- [ ] All validation commands pass with zero errors (ruff, mypy, pyright)
- [ ] Unit test coverage for vault_writer, all operations, service, models
- [ ] Integration tests verify end-to-end workflows with real files
- [ ] Code follows project conventions (VSA, logging patterns, naming)
- [ ] No regressions in existing obsidian_query_vault functionality
- [ ] Agent-optimized docstring follows template with all required sections
- [ ] Tool registered in tool_registry.py and appears in agent tools
- [ ] Error handling provides actionable messages with suggestions
- [ ] Performance meets requirements (50-200ms for single operations)
- [ ] Security: Path validation prevents directory traversal
- [ ] Safety: Deletion requires explicit confirmation
- [ ] Type checking passes in strict mode (100% type coverage)

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order from top to bottom
- [ ] Each task validation passed immediately after implementation
- [ ] All validation commands executed successfully (Level 1-5)
- [ ] Full test suite passes (unit + integration)
- [ ] No linting errors (ruff check clean)
- [ ] No type checking errors (mypy + pyright clean)
- [ ] Manual testing confirms all operations work correctly
- [ ] Acceptance criteria all met (verified above)
- [ ] Code reviewed for quality, maintainability, and consistency
- [ ] Documentation in docstrings is complete and agent-optimized
- [ ] Tool appears in agent's available tools list
- [ ] Integration with existing query_vault tool is seamless

---

## NOTES

### Key Design Decisions

**Why Consolidated Tool:**

- Reduces round-trips for common workflows (create → read → update)
- Agent can manage entire note lifecycle in coherent workflow
- Mirrors Anthropic's best practice of consolidating related operations
- Single interface reduces agent confusion about which tool to use

**Why Separate Operations Files:**

- Maintains VSA principle of clear separation of concerns
- Each operation can be tested independently
- Easy to add new operations without modifying existing code
- Mirrors successful pattern from obsidian_query_vault

**Why VaultWriter as Shared Utility:**

- Low-level write operations reused across operations
- Central place for write safety checks and validation
- Matches existing VaultReader pattern for symmetry
- Shared between note manager and future folder manager

**Why Agent-Optimized Docstrings:**

- LLM reads docstrings during tool selection
- "Use this when" / "Do NOT use" reduces tool confusion
- Performance notes guide token efficiency
- Examples show realistic usage patterns

### Trade-offs Made

**Batch Operations:**

- DECIDED: Include batch_mode parameter in tool design for future extensibility
- REASON: Common workflows like "update all project notes" benefit from batching
- IMPLEMENTATION: MVP will support single-note operations first, batch can be added incrementally
- RISK: Batch operations increase complexity; mitigate with clear validation and dry_run option

**Template System:**

- DECIDED: Simple string content for MVP, no variable substitution
- REASON: YAGNI - users can provide full content with variables pre-filled
- FUTURE: Can add template system with {{variable}} syntax in post-MVP

**Concurrent Access:**

- DECIDED: No file locking in MVP
- REASON: Obsidian and agent typically used by single user, not concurrent
- RISK: Potential race conditions if user edits in Obsidian while agent modifies
- MITIGATION: Document that agent should be used when not actively editing in Obsidian

### Confidence Score: 9/10

**Strengths:**

- Clear patterns established by existing obsidian_query_vault implementation
- Comprehensive documentation (PRD, tool designs, how-to guides)
- Well-defined type-safe models with Pydantic validation
- Proven VSA architecture reduces integration complexity
- Detailed task breakdown with validation steps

**Uncertainties:**

- Frontmatter update logic complexity (parsing, modifying, rewriting YAML)
- Batch operation implementation details (deferred to future iteration if needed)
- Performance characteristics with large notes (10MB+ files)
- Handling of concurrent file access edge cases

**Mitigations:**

- Follow simple frontmatter parsing pattern from VaultParser
- Start with single-note operations, add batch incrementally
- Add file size validation in VaultWriter (10MB limit documented)
- Document recommended usage patterns (don't use agent while editing in Obsidian)

### Implementation Timeline Estimate

- **Foundation (VaultWriter + models)**: 2-3 hours
- **Core Operations (6 operation handlers)**: 4-5 hours
- **Service + Tool (orchestration + docstring)**: 2-3 hours
- **Testing (unit + integration)**: 3-4 hours
- **Integration + Validation (registry + full suite)**: 1-2 hours

**Total Estimate**: 12-17 hours for complete, tested, validated implementation

**Risk Factors:**

- Frontmatter manipulation may require iteration
- Edge case testing may reveal unexpected behaviors
- Integration with existing tool registry may need debugging

**Success Indicators:**

- All validation commands pass on first try
- Integration tests work with real file operations
- Agent successfully selects and uses tool in natural language workflows
- No regressions in existing query_vault functionality
