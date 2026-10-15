
import asyncio
import json

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def main():
    server_params = StdioServerParameters(
        command="python",
        args=["-m", "backend.app.mcp_server"],
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            print("MCP connection successful!")

            result = await session.list_tools()
            print(
                "Tools discovered:",
                [tool.name for tool in result.tools],
            )

            task_id = None

            try:
                # 1. Create a temporary task
                print("\n1. Creating test task...")
                created = await session.call_tool(
                    "create_task",
                    arguments={
                        "title": "MCP CRUD Verification",
                        "description": "Temporary verification task",
                        "priority": "low",
                        "due_date": "2026-10-20",
                    },
                )
                print(created.content[0].text)

                if created.is_error:
                    print("Task creation failed.")
                    return

                created_data = json.loads(created.content[0].text)
                task_id = created_data["id"]
                print(f"Created task ID: {task_id}")

                # 2. Update the task
                print("\n2. Updating task...")
                updated = await session.call_tool(
                    "update_task",
                    arguments={
                        "task_id": task_id,
                        "title": "MCP CRUD Verification Updated",
                        "priority": "medium",
                    },
                )
                print(updated.content[0].text)

                if updated.is_error:
                    print("Task update failed.")
                    return

                # 3. Complete the task
                print("\n3. Completing task...")
                completed = await session.call_tool(
                    "complete_task",
                    arguments={"task_id": task_id},
                )
                print(completed.content[0].text)

                if completed.is_error:
                    print("Task completion failed.")
                    return

                # 4. Retrieve the task
                print("\n4. Retrieving task...")
                retrieved = await session.call_tool(
                    "get_task",
                    arguments={"task_id": task_id},
                )
                print(retrieved.content[0].text)

                if retrieved.is_error:
                    print("Task retrieval failed.")
                    return

                print("\nCreate, update, complete, and retrieve passed.")

            finally:
                # Clean up only the task created during this run
                if task_id is not None:
                    print("\n5. Deleting temporary test task...")
                    deleted = await session.call_tool(
                        "delete_task",
                        arguments={"task_id": task_id},
                    )
                    print(deleted.content[0].text)

                    if deleted.is_error:
                        print("Warning: test task deletion failed.")
                    else:
                        print("\n6. Verifying deletion...")
                        check = await session.call_tool(
                            "get_task",
                            arguments={"task_id": task_id},
                        )
                        print(check.content[0].text)

                        if check.is_error:
                            print(
                                "The server returned an error "
                                "when retrieving the deleted task."
                            )
                        else:
                            print(
                                "Check the response above to confirm "
                                "the task was not found."
                            )

            print("\nMCP verification finished.")


if __name__ == "__main__":
    asyncio.run(main())
