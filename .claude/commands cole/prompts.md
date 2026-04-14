## Prompt 1

/prime-tools

## Prompt 2

Based on the PRD what tool would it make sense to implement first? 

## Prompt 3

Yes let's do the Obsidian Query Vault tool. Let's start with some research right now, no implementation. Please read the .agents/reference/mvp-tool-designs.md and let's deeply plan out how to add the obsidian_query_vault tool, think hard about the VSA architecture and read .agents/reference/vsa-patterns.md identify where to place each new file and feature. The tools must be registered in the agent, I'd like to create a tool_registry.py file and add the tool registration code there.

Our existing agent implementation is in app/core/agents/

You must deeply research pydantic ai and how pydantic ai uses tools

FETCH: https://ai.pydantic.dev/tools/
1. Learn exactly how tools are registered and how we will register tools in our approach
2. Learn the exact tool schema we need.

Research advanced tool patterns:
FETCH: https://ai.pydantic.dev/tools-advanced/
FETCH: https://ai.pydantic.dev/toolsets/

Here is a good example tool:
FETCH: https://ai.pydantic.dev/toolsets/

## Prompt 4

/plan-feature Research any other examples and existing implementations as needed to fully understand the pydantic ai framework and how we need to work with it.

This feature will allow users to search their vault. This is the first tool we add to this agent, it should follow best practices and excellent patterns that we can mirror for future tools.

Make sure you update the agent.py system prompt to make the agent aware that the tool exists, let it know that it only has this tool for now.

Make sure naming is extremely clear and verbose. We want to have names like obsidian_query_vault_tool/ obsidian_query_vault_tool.py.

The feature slice should be named app/features/obsidian_query_vault/ inside the feature slice file names should be obsidian_query_vault_models.py etc

This is to make the files and functions very greppable and easy to find.

## Prompt 5

This plan is WAY too long, it needs to be a lot more concise. Do some meta reasoning here and help me understand why the plan is so long (1700+ lines) and how I can adjust plan-feature to avoid this in the future.

## Prompt 6

/execute [path-to-plan]

