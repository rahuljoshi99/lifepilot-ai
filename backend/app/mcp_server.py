
from mcp.server import MCPServer

from backend.app.database import get_connection, initialize_database


mcp = MCPServer(
    name="LifePilot AI",
    instructions="Tools for retrieving tasks from LifePilot AI.",
    version="1.0.0",
)


def serialize_task(row):
    task = dict(row)
    task["completed"] = bool(task["completed"])
    return task


def get_tasks(
    completed: bool | None = None,
    priority: str | None = None,
) -> list[dict]:
    """Retrieve tasks, optionally filtered by completion status and priority."""
    if priority is not None and priority not in {"low", "medium", "high"}:
        return [{"error": "Priority must be low, medium, or high."}]

    query = "SELECT * FROM tasks"
    conditions = []
    parameters = []

    if completed is not None:
        conditions.append("completed = ?")
        parameters.append(int(completed))

    if priority is not None:
        conditions.append("priority = ?")
        parameters.append(priority)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY id"

    with get_connection() as connection:
        rows = connection.execute(query, parameters).fetchall()

    return [serialize_task(row) for row in rows]


def get_task(task_id: int) -> dict:
    """Retrieve one task by its ID."""
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()

    if row is None:
        return {"error": f"Task with ID {task_id} was not found."}

    return serialize_task(row)


mcp.add_tool(get_tasks)
mcp.add_tool(get_task)


if __name__ == "__main__":
    initialize_database()
    mcp.run()
