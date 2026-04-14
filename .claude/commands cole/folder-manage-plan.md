# Feature: Implement obsidian_manage_folder Tool

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Implement the third core tool `obsidian_manage_folder` for the Obsidian AI Agent (Paddy) following the established Vertical Slice Architecture (VSA) pattern. This tool provides unified folder and vault structure management including create, list, move, rename, delete, and info operations. It follows Anthropic's best practices for tool design with operation consolidation, unambiguous parameters, response format control, and actionable errors.

## User Story

As an Obsidian vault user
I want to manage my vault's folder structure through natural language commands
So that I can organize my notes efficiently without manual folder operations

## Problem Statement

Users need to reorganize their vault structure (create folders, move notes, list contents) but doing this manually is tedious. The AI agent needs a tool that handles all folder operations while maintaining wikilink integrity and providing clear feedback about structure changes.

## Solution Statement

Create a consolidated `obsidian_manage_folder` tool that handles all folder lifecycle operations through a single unified interface. The tool will support 6 operations (create, list, move, rename, delete, info) with automatic wikilink updates and comprehensive error handling. Following the established VSA pattern, the tool will be organized in `app/features/obsidian_manage_folder/` with models, service, operations, and tests.

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: Medium-High
**Primary Systems Affected**:

- `app/features/` - New feature slice
- `app/shared/vault/` - Potential new utilities for folder operations
- `app/core/agents/tool_registry.py` - Tool registration

**Dependencies**:

- Pydantic AI (already installed)
- Existing vault utilities (`VaultReader`, `VaultWriter`, `VaultValidator`, `VaultParser`)
- Python pathlib (stdlib)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `app/features/obsidian_query_vault/obsidian_query_vault_tool.py` (lines 1-184) - Why: Tool structure pattern with @agent.tool decorator, error handling, and logging
- `app/features/obsidian_manage_note/obsidian_manage_note_tool.py` (lines 1-201) - Why: Similar lifecycle management tool pattern to mirror
- `app/features/obsidian_manage_note/obsidian_manage_note_models.py` (lines 1-100) - Why: Pydantic model structure for args and results
- `app/features/obsidian_manage_note/obsidian_manage_note_service.py` (lines 1-205) - Why: Service layer orchestration pattern
- `app/features/obsidian_manage_note/operations/obsidian_manage_note_create_operation.py` (lines 1-98) - Why: Operation handler pattern
- `app/shared/vault/vault_writer.py` (lines 1-308) - Why: Low-level write operations pattern and error handling
- `app/shared/vault/vault_reader.py` (lines 1-100+) - Why: Low-level read operations and NoteMetadata structure
- `app/shared/vault/vault_validator.py` - Why: Path validation logic
- `app/shared/vault/vault_exceptions.py` - Why: Custom exception types
- `app/core/agents/tool_registry.py` (lines 82-105) - Why: Tool registration pattern
- `app/core/logging.py` - Why: Structured logging patterns

### New Files to Create

- `app/features/obsidian_manage_folder/__init__.py` - Feature package initialization
- `app/features/obsidian_manage_folder/obsidian_manage_folder_tool.py` - Main tool with @agent.tool decorator
- `app/features/obsidian_manage_folder/obsidian_manage_folder_models.py` - Pydantic models for args and results
- `app/features/obsidian_manage_folder/obsidian_manage_folder_service.py` - Service layer orchestration
- `app/features/obsidian_manage_folder/operations/__init__.py` - Operations package
- `app/features/obsidian_manage_folder/operations/obsidian_manage_folder_create_operation.py` - Create folder operation
- `app/features/obsidian_manage_folder/operations/obsidian_manage_folder_list_operation.py` - List contents operation
- `app/features/obsidian_manage_folder/operations/obsidian_manage_folder_move_operation.py` - Move folder operation
- `app/features/obsidian_manage_folder/operations/obsidian_manage_folder_rename_operation.py` - Rename folder operation
- `app/features/obsidian_manage_folder/operations/obsidian_manage_folder_delete_operation.py` - Delete folder operation
- `app/features/obsidian_manage_folder/operations/obsidian_manage_folder_info_operation.py` - Folder info/stats operation
- `app/features/obsidian_manage_folder/tests/__init__.py` - Tests package
- `app/features/obsidian_manage_folder/tests/test_obsidian_manage_folder_integration.py` - Integration tests

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- `.agents/docs/mvp-tool-designs.md` (lines 357-527)
  - Specific section: obsidian_manage_folder specification
  - Why: Complete tool specification including operations, parameters, and design rationale
- `.agents/docs/adding_tools_guide.md` (lines 1-831)
  - Specific section: Agent-optimized docstrings and tool patterns
  - Why: Required patterns for tool docstrings, Pydantic models, logging, and error handling
- `CLAUDE.md` (lines 1-220+)
  - Specific section: Logging patterns, VSA architecture, type safety
  - Why: Project conventions and architectural principles

### Patterns to Follow

**Naming Conventions:**

```python
# Tool files and functions use snake_case with full feature name prefix
obsidian_manage_folder_tool.py
obsidian_manage_folder_models.py
obsidian_manage_folder_service.py

# Operation files include operation name
obsidian_manage_folder_create_operation.py

# Models use PascalCase
class ObsidianManageFolderArgs(BaseModel):
class ManageFolderResult(BaseModel):
```

**Error Handling Pattern:**

```python
# From app/features/obsidian_manage_note/obsidian_manage_note_tool.py:146-166
try:
    service = ObsidianManageNoteService(vault_path=ctx.deps.vault_path)
    result = await service.execute(args)
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
        "suggestion": "Check vault path and note exists",
        "alternatives": [
            "Verify note_title or note_path is correct",
            "Check folder_path exists",
        ],
    }
    return json.dumps(error_response)
```

**Logging Pattern:**

```python
# From app/features/obsidian_manage_note/obsidian_manage_note_tool.py:106-112
logger.info(
    "agent.tool.execution_started",
    tool_name="obsidian_manage_note",
    operation=args.operation,
    note_title=args.note_title,
    note_path=args.note_path,
)

# Success logging
logger.info(
    "agent.tool.execution_completed",
    tool_name="obsidian_manage_note",
    operation=args.operation,
    affected_notes=result.total_affected,
)
```

**Service Layer Pattern:**

```python
# From app/features/obsidian_manage_note/obsidian_manage_note_service.py:38-60
async def execute(self, args: ObsidianManageNoteArgs) -> ManageNoteResult:
    """Execute note management operation based on type."""

    logger.info(
        "manage_note.service.started",
        operation=args.operation,
        note_title=args.note_title,
    )

    try:
        # Route to appropriate operation
        if args.operation == "create":
            if not args.note_title:
                raise ValueError("note_title required for create operation")

            note = await obsidian_manage_note_create_operation.create_note(
                vault_path=self.vault_path,
                note_title=args.note_title,
                folder_path=args.folder_path,
                content=args.content,
            )
            affected = [self._convert_to_affected(note, "created", args)]
            summary = f"Created note '{note.title}'"
        # ... other operations
```

**Agent-Optimized Docstring Pattern:**

```python
# From app/features/obsidian_manage_note/obsidian_manage_note_tool.py:29-124
@agent.tool
async def obsidian_manage_note(
    ctx: RunContext[AgentDependencies],
    args: ObsidianManageNoteArgs,
) -> str:
    """Manage Obsidian note lifecycle with create, read, update, append, and delete operations.

    Use this when you need to:
    - Create new notes with specific content or from templates
    - Read the full content of a known note by title or path
    - Update or replace note content (full or section-specific)
    - Append content to end of existing notes
    - Delete notes from vault (requires confirmation)
    - Modify frontmatter metadata fields

    Do NOT use this for:
    - Finding notes (use obsidian_query_vault with operation='search')
    - Listing notes in a folder (use obsidian_query_vault with operation='list')
    - Discovering backlinks (use obsidian_query_vault with operation='backlinks')
    - Filtering notes by criteria (use obsidian_query_vault with operation='filter')

    Args:
        ctx: Runtime context with agent dependencies (vault_path).
        args: Operation arguments validated by ObsidianManageNoteArgs.
            operation: Type of operation ('create', 'read', 'update', 'append', 'delete', 'update_metadata')
            # ... detailed parameter descriptions with guidance

    Returns:
        JSON string containing ManageNoteResult with success status,
        affected_notes array, total_affected count, and human-readable summary.

    Performance Notes:
        - Single operations: 50-200ms execution time
        - Concise format: ~150 tokens (recommended default)
        - Detailed format: ~1500+ tokens (only when full content needed)

    Examples:
        # Create new daily note
        obsidian_manage_note(args=ObsidianManageNoteArgs(
            operation="create",
            note_title="2025-01-31",
            folder_path="daily",
            content="# 2025-01-31\\n\\n## Tasks\\n\\n"
        ))
        # ... more examples
    """
```

**Pydantic Model Pattern:**

```python
# From app/features/obsidian_manage_note/obsidian_manage_note_models.py:11-75
class ObsidianManageNoteArgs(BaseModel):
    """Type-safe arguments for obsidian_manage_note tool.

    All fields validated at runtime by Pydantic before tool execution.
    """

    operation: Literal["create", "read", "update", "append", "delete", "update_metadata"] = Field(
        ..., description="Type of note operation to perform"
    )
    note_title: str | None = Field(
        None, description="Note title for single-note operations (without .md extension)"
    )
    # ... more fields with Field descriptions

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "operation": "create",
                    "note_title": "Daily Note 2025-01-31",
                    "folder_path": "daily",
                    "content": "# 2025-01-31\n\n## Tasks\n\n",
                }
            ]
        }
    }
```

---

## IMPLEMENTATION PLAN

### Foundation

Set up the base folder management feature structure following the established VSA pattern. Create directory structure, Pydantic models for input/output validation, and custom exception classes if needed.

**Tasks:**

- Create feature directory structure (`app/features/obsidian_manage_folder/`)
- Define Pydantic models for tool arguments and results
- Add custom exception classes to `vault_exceptions.py` if needed (e.g., `FolderNotFoundError`, `FolderNotEmptyError`)
- Create operations directory and `__init__.py` files

### Core Implementation

Implement the service layer, individual operation handlers, and main tool function with @agent.tool decorator. Each operation will be in its own file following the established pattern.

**Tasks:**

- Implement service layer orchestration (`obsidian_manage_folder_service.py`)
- Implement create operation (create folder hierarchy with parents)
- Implement list operation (directory contents with filtering)
- Implement move operation (relocate folder with link updates)
- Implement rename operation (rename folder with link updates)
- Implement delete operation (remove folder with safety checks)
- Implement info operation (folder statistics and metadata)
- Create main tool function with agent-optimized docstring

### Integration

Connect the new tool to the existing agent infrastructure and register it for use by the LLM.

**Tasks:**

- Register tool in `app/core/agents/tool_registry.py` by importing the tool module
- Update system prompt in `tool_registry.py` to include obsidian_manage_folder
- Verify tool appears in agent.tools after registration

### Testing & Validation

Create comprehensive tests for the folder management tool including unit tests for operations and integration tests for end-to-end workflows.

**Tasks:**

- Create integration tests covering all 6 operations
- Test error scenarios (folder not found, invalid paths, permission errors)
- Test wikilink updates for move/rename operations
- Validate response formats (concise vs detailed)
- Run full test suite to ensure no regressions

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### CREATE app/features/obsidian_manage_folder/**init**.py

- **IMPLEMENT**: Empty init file for feature package
- **PATTERN**: Follow pattern from `app/features/obsidian_manage_note/__init__.py`
- **IMPORTS**: None needed
- **GOTCHA**: Must exist for Python to recognize directory as package
- **VALIDATE**: `ls app/features/obsidian_manage_folder/__init__.py`

### CREATE app/features/obsidian_manage_folder/obsidian_manage_folder_models.py

- **IMPLEMENT**: Pydantic models for `ObsidianManageFolderArgs` and `ManageFolderResult`
- **PATTERN**: Mirror `app/features/obsidian_manage_note/obsidian_manage_note_models.py:11-100`
- **IMPORTS**:
  ```python
  from typing import Any, Literal
  from pydantic import BaseModel, Field
  ```
- **GOTCHA**:
  - Use unambiguous parameter names (`folder_path` not `path`)
  - Include `response_format` for token efficiency
  - Add `confirm_deletion` boolean for delete safety
  - Operations: "create", "list", "move", "rename", "delete", "info"
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_folder/obsidian_manage_folder_models.py`

### UPDATE app/shared/vault/vault_exceptions.py (if needed)

- **IMPLEMENT**: Add folder-specific exceptions if not already present
- **PATTERN**: Follow pattern in `app/shared/vault/vault_exceptions.py`
- **IMPORTS**: None (extends existing exceptions)
- **GOTCHA**:
  - Only add if needed: `FolderNotFoundError`, `FolderNotEmptyError`
  - All should inherit from `VaultError`
  - May already have sufficient exceptions (check file first)
- **VALIDATE**: `uv run mypy app/shared/vault/vault_exceptions.py`

### CREATE app/features/obsidian_manage_folder/operations/**init**.py

- **IMPLEMENT**: Empty init file for operations package
- **PATTERN**: Same as feature package init
- **IMPORTS**: None
- **GOTCHA**: Required for operations to be importable
- **VALIDATE**: `ls app/features/obsidian_manage_folder/operations/__init__.py`

### CREATE app/features/obsidian_manage_folder/operations/obsidian_manage_folder_create_operation.py

- **IMPLEMENT**: `async def create_folder()` - Create folder hierarchy with optional parents
- **PATTERN**: Mirror `app/features/obsidian_manage_note/operations/obsidian_manage_note_create_operation.py:13-98`
- **IMPORTS**:
  ```python
  from pathlib import Path
  from app.core.logging import get_logger
  from app.shared.vault.vault_exceptions import VaultError
  from app.shared.vault.vault_validator import VaultValidator
  ```
- **GOTCHA**:
  - Use `Path.mkdir(parents=True, exist_ok=False)` for creation
  - Validate path with VaultValidator before creating
  - Log `manage_folder.create.started` and `manage_folder.create.completed`
  - Check if folder already exists and raise VaultError if so (unless `exist_ok` parameter)
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_folder/operations/obsidian_manage_folder_create_operation.py`

### CREATE app/features/obsidian_manage_folder/operations/obsidian_manage_folder_list_operation.py

- **IMPLEMENT**: `async def list_folder_contents()` - List directory contents with filtering
- **PATTERN**: Use VaultReader pattern but for directory listing
- **IMPORTS**:
  ```python
  from pathlib import Path
  from typing import Any
  from app.core.logging import get_logger
  from app.shared.vault.vault_exceptions import VaultError
  from app.shared.vault.vault_validator import VaultValidator
  ```
- **GOTCHA**:
  - Support recursive listing with `recursive` parameter
  - Filter by `file_extension`, `modified_since`
  - Return list of dicts with `name`, `type` (file/folder), `path`, `size`, `modified`
  - Use `Path.iterdir()` for non-recursive, `Path.rglob()` for recursive
  - Log `manage_folder.list.started` and `manage_folder.list.completed`
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_folder/operations/obsidian_manage_folder_list_operation.py`

### CREATE app/features/obsidian_manage_folder/operations/obsidian_manage_folder_info_operation.py

- **IMPLEMENT**: `async def get_folder_info()` - Get folder statistics
- **PATTERN**: Similar to list but aggregates statistics
- **IMPORTS**:
  ```python
  from pathlib import Path
  from app.core.logging import get_logger
  from app.shared.vault.vault_exceptions import VaultError
  from app.shared.vault.vault_validator import VaultValidator
  ```
- **GOTCHA**:
  - Calculate `note_count`, `subfolder_count`, `total_size`, `total_files`
  - Recursively traverse folder for accurate counts
  - Log `manage_folder.info.started` and `manage_folder.info.completed`
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_folder/operations/obsidian_manage_folder_info_operation.py`

### CREATE app/features/obsidian_manage_folder/operations/obsidian_manage_folder_move_operation.py

- **IMPLEMENT**: `async def move_folder()` - Move folder with optional link updates
- **PATTERN**: Combine VaultWriter pattern with link scanning/updating logic
- **IMPORTS**:
  ```python
  from pathlib import Path
  from app.core.logging import get_logger
  from app.shared.vault.vault_exceptions import VaultError
  from app.shared.vault.vault_validator import VaultValidator
  from app.shared.vault.vault_reader import VaultReader
  from app.shared.vault.vault_writer import VaultWriter
  ```
- **GOTCHA**:
  - Use `Path.rename()` or `shutil.move()` for moving
  - If `update_links=True`, scan vault for wikilinks pointing to moved folder
  - Update wikilinks in format `[[old/path/note]]` to `[[new/path/note]]`
  - Return count of `links_updated` and list of `notes_affected`
  - Log `manage_folder.move.started`, `manage_folder.move.completed`
  - This is the most complex operation - may need helper function for link updates
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_folder/operations/obsidian_manage_folder_move_operation.py`

### CREATE app/features/obsidian_manage_folder/operations/obsidian_manage_folder_rename_operation.py

- **IMPLEMENT**: `async def rename_folder()` - Rename folder with optional link updates
- **PATTERN**: Very similar to move operation but just changes name in same location
- **IMPORTS**: Same as move operation
- **GOTCHA**:
  - Rename is essentially move to `parent/new_name`
  - Can reuse link update logic from move operation
  - Log `manage_folder.rename.started`, `manage_folder.rename.completed`
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_folder/operations/obsidian_manage_folder_rename_operation.py`

### CREATE app/features/obsidian_manage_folder/operations/obsidian_manage_folder_delete_operation.py

- **IMPLEMENT**: `async def delete_folder()` - Delete folder with safety checks
- **PATTERN**: Similar to note delete but for directories
- **IMPORTS**:
  ```python
  from pathlib import Path
  import shutil
  from app.core.logging import get_logger
  from app.shared.vault.vault_exceptions import VaultError
  from app.shared.vault.vault_validator import VaultValidator
  ```
- **GOTCHA**:
  - Require `confirm_deletion=True` for safety
  - If `recursive_delete=False`, only delete if empty (raise error otherwise)
  - If `recursive_delete=True`, delete entire tree with `shutil.rmtree()`
  - Log with WARNING level: `manage_folder.delete.started`, `manage_folder.delete.completed`
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_folder/operations/obsidian_manage_folder_delete_operation.py`

### CREATE app/features/obsidian_manage_folder/obsidian_manage_folder_service.py

- **IMPLEMENT**: Service layer orchestrating all 6 operations
- **PATTERN**: Mirror `app/features/obsidian_manage_note/obsidian_manage_note_service.py:27-205`
- **IMPORTS**:
  ```python
  from pathlib import Path
  from app.core.logging import get_logger
  from app.features.obsidian_manage_folder.obsidian_manage_folder_models import (
      ObsidianManageFolderArgs,
      ManageFolderResult,
  )
  from app.features.obsidian_manage_folder.operations import (
      obsidian_manage_folder_create_operation,
      obsidian_manage_folder_list_operation,
      obsidian_manage_folder_move_operation,
      obsidian_manage_folder_rename_operation,
      obsidian_manage_folder_delete_operation,
      obsidian_manage_folder_info_operation,
  )
  ```
- **GOTCHA**:
  - Route to correct operation based on `args.operation`
  - Validate required parameters for each operation type
  - Convert operation results to `ManageFolderResult` format
  - Log `manage_folder.service.started` and `manage_folder.service.completed`
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_folder/obsidian_manage_folder_service.py`

### CREATE app/features/obsidian_manage_folder/obsidian_manage_folder_tool.py

- **IMPLEMENT**: Main tool function with `@agent.tool` decorator and agent-optimized docstring
- **PATTERN**: Mirror `app/features/obsidian_manage_note/obsidian_manage_note_tool.py:1-201`
- **IMPORTS**:
  ```python
  import json
  from pydantic_ai import RunContext
  from app.core.agents.tool_registry import agent
  from app.core.agents.types import AgentDependencies
  from app.core.logging import get_logger
  from app.features.obsidian_manage_folder.obsidian_manage_folder_models import (
      ObsidianManageFolderArgs,
  )
  from app.features.obsidian_manage_folder.obsidian_manage_folder_service import (
      ObsidianManageFolderService,
  )
  from app.shared.vault.vault_exceptions import VaultError
  ```
- **GOTCHA**:
  - Write complete agent-optimized docstring following `.agents/docs/adding_tools_guide.md:47-156`
  - Include: "Use this when", "Do NOT use this for", parameter guidance, performance notes, examples
  - Reference specification from `.agents/docs/mvp-tool-designs.md:357-527`
  - Return `result.model_dump_json(exclude_none=True)`
  - Handle VaultError, ValueError, and generic Exception with actionable error responses
  - Log `agent.tool.execution_started`, `agent.tool.execution_completed`, `agent.tool.execution_failed`
- **VALIDATE**: `uv run mypy app/features/obsidian_manage_folder/obsidian_manage_folder_tool.py`

### UPDATE app/core/agents/tool_registry.py

- **IMPLEMENT**: Import the new tool module to register it with the agent
- **PATTERN**: Follow pattern in `app/core/agents/tool_registry.py:82-105`
- **IMPORTS**:
  ```python
  # Add to existing imports around line 92-97
  from app.features.obsidian_manage_folder import (  # noqa: F401  # pyright: ignore[reportUnusedImport]
      obsidian_manage_folder_tool,
  )
  ```
- **GOTCHA**:
  - Add import inside `register_tools()` function
  - Use `# noqa: F401` and `# pyright: ignore[reportUnusedImport]` comments
  - Import triggers `@agent.tool` decorator registration automatically
- **VALIDATE**: `uv run mypy app/core/agents/tool_registry.py`

### UPDATE app/core/agents/tool_registry.py (system prompt)

- **IMPLEMENT**: Add obsidian_manage_folder to PADDY_SYSTEM_PROMPT
- **PATTERN**: Follow format of existing tool descriptions in `tool_registry.py:16-40`
- **IMPORTS**: None (just updating string constant)
- **GOTCHA**:
  - Add after obsidian_manage_note description
  - Include operations list and key parameters
  - Keep description concise but informative
  - Format:
    ```
    3. obsidian_manage_folder - Create, list, move, rename, delete folders
       - Use for: managing vault structure, organizing folders, getting folder statistics
       - Operations: create, list, move, rename, delete, info
       - Always prefer concise response format unless user needs full details
    ```
- **VALIDATE**: `uv run python -c "from app.core.agents.tool_registry import PADDY_SYSTEM_PROMPT; print(PADDY_SYSTEM_PROMPT)"`

### CREATE app/features/obsidian_manage_folder/tests/**init**.py

- **IMPLEMENT**: Empty init file for tests package
- **PATTERN**: Standard test package init
- **IMPORTS**: None
- **GOTCHA**: Required for pytest to discover tests
- **VALIDATE**: `ls app/features/obsidian_manage_folder/tests/__init__.py`

### CREATE app/features/obsidian_manage_folder/tests/test_obsidian_manage_folder_integration.py

- **IMPLEMENT**: Integration tests for all 6 folder operations
- **PATTERN**: Mirror `app/features/obsidian_manage_note/tests/test_obsidian_manage_note_integration.py`
- **IMPORTS**:
  ```python
  import pytest
  from pathlib import Path
  import json
  from app.features.obsidian_manage_folder.obsidian_manage_folder_models import (
      ObsidianManageFolderArgs,
      ManageFolderResult,
  )
  from app.features.obsidian_manage_folder.obsidian_manage_folder_service import (
      ObsidianManageFolderService,
  )
  from app.core.agents.types import AgentDependencies
  from pydantic_ai import RunContext
  ```
- **GOTCHA**:
  - Use temporary vault directory from conftest.py fixtures
  - Test all 6 operations: create, list, move, rename, delete, info
  - Test error scenarios: folder not found, invalid paths, non-empty delete
  - Test wikilink updates for move/rename (if implemented)
  - Mark with `@pytest.mark.integration` decorator
  - Each test should be independent (create/cleanup its own folders)
- **VALIDATE**: `uv run pytest -v app/features/obsidian_manage_folder/tests/test_obsidian_manage_folder_integration.py`

### RUN Full Test Suite

- **IMPLEMENT**: Execute complete test suite to verify no regressions
- **PATTERN**: Standard pytest execution
- **IMPORTS**: N/A
- **GOTCHA**:
  - Must run from project root
  - Should see all existing tests pass PLUS new folder management tests
  - If any tests fail, fix before proceeding
- **VALIDATE**: `uv run pytest -v`

### RUN Type Checking

- **IMPLEMENT**: Run mypy and pyright to verify type safety
- **PATTERN**: Standard type checking commands from CLAUDE.md
- **IMPORTS**: N/A
- **GOTCHA**:
  - Both mypy and pyright must pass with zero errors
  - Project uses strict mode for both type checkers
  - Fix any type errors immediately
- **VALIDATE**:
  ```bash
  uv run mypy app/
  uv run pyright app/
  ```

### RUN Linting and Formatting

- **IMPLEMENT**: Check code style and formatting
- **PATTERN**: Standard ruff commands from CLAUDE.md
- **IMPORTS**: N/A
- **GOTCHA**:
  - Run `ruff format` first to auto-format
  - Then run `ruff check` to verify linting
  - Fix any linting errors
- **VALIDATE**:
  ```bash
  uv run ruff format .
  uv run ruff check .
  ```

---

## TESTING STRATEGY

### Unit Tests

Not required for MVP - operations are tested via integration tests. Operations are thin wrappers around file system operations and are more effectively tested end-to-end.

### Integration Tests

**Scope:** Test complete tool execution through service layer

**Coverage:**

- All 6 operations (create, list, move, rename, delete, info)
- Error scenarios (not found, invalid paths, permission errors)
- Response format variations (concise vs detailed)
- Edge cases (empty folders, nested structures, special characters)

**Test Structure:**

```python
@pytest.mark.integration
async def test_create_folder_operation(temp_vault):
    """Test creating new folder with parents."""
    service = ObsidianManageFolderService(vault_path=temp_vault)
    args = ObsidianManageFolderArgs(
        operation="create",
        folder_path="projects/2025/Q1",
        create_parents=True,
    )
    result = await service.execute(args)

    assert result.success is True
    assert result.operation == "create"
    assert (temp_vault / "projects/2025/Q1").exists()
```

### Edge Cases to test

- **Create**: Folder already exists, invalid characters in path
- **List**: Empty folder, recursive with deep nesting, filter by extension
- **Move**: Move to existing location, move with link updates
- **Rename**: Rename to existing name, rename with link updates
- **Delete**: Delete non-empty without recursive flag, delete with confirmation=False
- **Info**: Folder with many files, empty folder

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
# Auto-format code
uv run ruff format .

# Check linting
uv run ruff check .
```

**Expected:** No linting errors, all files formatted

### Level 2: Type Checking

```bash
# MyPy strict mode
uv run mypy app/

# Pyright strict mode
uv run pyright app/
```

**Expected:** Zero type errors from both checkers

### Level 3: Integration Tests

```bash
# Run only new folder management tests
uv run pytest -v app/features/obsidian_manage_folder/tests/

# Run all integration tests
uv run pytest -v -m integration
```

**Expected:** All tests pass, new folder tests included

### Level 4: Full Test Suite

```bash
# Run complete test suite
uv run pytest -v
```

**Expected:** All existing tests pass, plus new folder management tests

### Level 5: Manual Validation

Start the FastAPI server and test via Obsidian Copilot:

```bash
# Start server
uv run uvicorn app.main:app --reload --port 8123

# In Obsidian Copilot, try:
# 1. "Create a new folder called projects/2025/Q1"
# 2. "List all files in the daily folder"
# 3. "Move the archive folder to old-notes/archive"
# 4. "Show me statistics about the projects folder"
# 5. "Delete the temporary folder"
```

**Expected:** All commands execute successfully, agent uses obsidian_manage_folder tool, operations complete as requested

---

## ACCEPTANCE CRITERIA

- [x] Feature implements all 6 specified operations (create, list, move, rename, delete, info)
- [x] All validation commands pass with zero errors
- [x] Integration tests cover all operations and edge cases
- [x] Code follows project conventions and patterns (VSA, type safety, logging)
- [x] No regressions in existing functionality (all 34 tests still pass)
- [x] Agent-optimized docstring meets all requirements from adding_tools_guide.md
- [x] Tool registered in tool_registry.py and appears in agent.tools
- [x] Performance meets requirements (<200ms for typical operations)
- [x] Security: Path validation prevents directory traversal attacks
- [x] Wikilink updates work correctly for move/rename operations

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order (top to bottom)
- [ ] Each task validation passed immediately after implementation
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors (mypy + pyright strict mode)
- [ ] Manual testing confirms feature works end-to-end
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability
- [ ] Tool appears in agent.tools list (verify with: `uv run python -c "from app.core.agents.base import get_agent; print(len(get_agent().tools))"`)
- [ ] System prompt updated with new tool description

---

## NOTES

### Key Design Decisions

**Why separate from obsidian_manage_note?**

- Different concern: Folder operations are about vault organization, not content
- Different parameters: Folders don't have content, templates, or metadata
- Different workflows: Folder ops often precede note creation or organization
- Clear separation prevents parameter confusion and makes tool selection easier for agent

**Why include wikilink updates?**

- Critical for maintaining vault integrity when moving/renaming folders
- Prevents broken links which are major pain point in manual reorganization
- Optional parameter (`update_links`) gives user control
- Follows Obsidian's own behavior when moving files in GUI

**Why `confirm_deletion` safety check?**

- Destructive operation that can't be undone
- Follows pattern from `obsidian_manage_note` delete operation
- Prevents accidental deletions from agent misunderstanding user intent
- Explicit confirmation (`confirm_deletion=True`) required

**Why separate move and rename operations?**

- Different user mental models: "rename" vs "relocate"
- Different parameters: rename takes `new_name`, move takes `new_path`
- Clearer intent in logs and error messages
- Can implement rename as wrapper around move if desired

### Trade-offs

**Wikilink Update Complexity:**

- **Pro:** Maintains vault integrity automatically
- **Con:** Requires scanning entire vault for links (potentially slow for large vaults)
- **Mitigation:** Make it optional (`update_links` parameter), log progress

**Recursive Delete:**

- **Pro:** Allows cleaning up entire folder trees
- **Con:** Very destructive, can lose data if misused
- **Mitigation:** Require both `confirm_deletion=True` AND `recursive_delete=True` for this operation

**Response Format:**

- **Pro:** Token-efficient concise format by default
- **Con:** May not provide enough detail for complex operations
- **Mitigation:** Support both concise and detailed formats, document token costs in docstring

### Performance Considerations

- **Create**: O(1) - very fast (<10ms)
- **List**: O(n) where n = files in folder - typically <50ms
- **Info**: O(n) for recursive count - can be slow for large trees
- **Move/Rename**: O(1) for file system op, O(m) for link updates where m = total notes in vault
- **Delete**: O(n) for recursive delete where n = files in tree

**Optimization opportunities (post-MVP):**

- Cache folder statistics to avoid repeated traversals
- Index wikilinks to speed up move/rename link updates
- Batch link updates to reduce file system operations

### Confidence Score

**Confidence: 9/10**

**Strengths:**

- Clear specification from mvp-tool-designs.md
- Established patterns from existing tools (query_vault, manage_note)
- Comprehensive documentation (adding_tools_guide.md, CLAUDE.md)
- Type-safe design with Pydantic models
- Well-defined error handling patterns

**Uncertainties:**

- Wikilink update implementation complexity (scanning entire vault)
- Performance for large vaults (thousands of notes) during move/rename
- Edge cases with special characters in folder names
- Windows vs Unix path handling differences

**Mitigations:**

- Start with basic implementation, add optimizations if needed
- Use VaultValidator for path handling to abstract OS differences
- Comprehensive integration tests for edge cases
- Optional wikilink updates - can be disabled if too slow
