
from typing import Any

from mcp.server import MCPServer

from backend.app.database import get_connection, initialize_database


VALID_PRIORITIES = {"low", "medium", "high"}

mcp = MCPServer(
    name="LifePilot AI",
    instructions=(
        "Tools for managing LifePilot AI tasks. "
        "Use these tools to retrieve, create, update, complete, "
        "and delete tasks. Check task IDs before modifying tasks."
    ),
    version="1.1.0",
)


def serialize_task(row: Any) -> dict:
    """Convert a SQLite task row to a JSON-friendly dictionary."""
    task = dict(row)
    task["completed"] = bool(task["completed"])
    return task


def get_tasks(
    completed: bool | None = None,
    priority: str | None = None,
) -> list[dict]:
    """Retrieve tasks, optionally filtered by completion status and priority."""
    if priority is not None and priority not in VALID_PRIORITIES:
        return [{"error": "Priority must be low, medium, or high."}]

    query = (
        "SELECT id, title, description, completed, priority, due_date "
        "FROM tasks"
    )
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
            """
            SELECT id, title, description, completed, priority, due_date
            FROM tasks
            WHERE id = ?
            """,
            (task_id,),
        ).fetchone()

    if row is None:
        return {"error": f"Task with ID {task_id} was not found."}

    return serialize_task(row)


def create_task(
    title: str,
    description: str = "",
    priority: str = "medium",
    due_date: str | None = None,
) -> dict:
    """Create a task. Due date must use YYYY-MM-DD format if supplied."""
    title = title.strip()
    description = description.strip()

    if not title:
        return {"error": "Task title cannot be empty."}

    if priority not in VALID_PRIORITIES:
        return {"error": "Priority must be low, medium, or high."}

    if due_date is not None:
        try:
            from datetime import date

            due_date = date.fromisoformat(due_date).isoformat()
        except ValueError:
            return {"error": "Due date must use YYYY-MM-DD format."}

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO tasks (title, description, completed, priority, due_date)
            VALUES (?, ?, 0, ?, ?)
            """,
            (title, description, priority, due_date),
        )
        task_id = cursor.lastrowid

        row = connection.execute(
            """
            SELECT id, title, description, completed, priority, due_date
            FROM tasks
            WHERE id = ?
            """,
            (task_id,),
        ).fetchone()

    return serialize_task(row)


def update_task(
    task_id: int,
    title: str | None = None,
    description: str | None = None,
    priority: str | None = None,
    due_date: str | None = None,
    clear_due_date: bool = False,
) -> dict:
    """Update supplied task fields. Set clear_due_date to remove the due date."""
    if priority is not None and priority not in VALID_PRIORITIES:
        return {"error": "Priority must be low, medium, or high."}

    if clear_due_date and due_date is not None:
        return {"error": "Provide due_date or clear_due_date, not both."}

    if due_date is not None:
        try:
            from datetime import date

            due_date = date.fromisoformat(due_date).isoformat()
        except ValueError:
            return {"error": "Due date must use YYYY-MM-DD format."}

    updates = []
    parameters = []

    if title is not None:
        title = title.strip()
        if not title:
            return {"error": "Task title cannot be empty."}
        updates.append("title = ?")
        parameters.append(title)

    if description is not None:
        updates.append("description = ?")
        parameters.append(description.strip())

    if priority is not None:
        updates.append("priority = ?")
        parameters.append(priority)

    if clear_due_date:
        updates.append("due_date = NULL")
    elif due_date is not None:
        updates.append("due_date = ?")
        parameters.append(due_date)

    if not updates:
        return {
            "error": (
                "No changes supplied. Provide a field to update "
                "or set clear_due_date=true."
            )
        }

    parameters.append(task_id)

    with get_connection() as connection:
        existing = connection.execute(
            "SELECT id FROM tasks WHERE id = ?",
            (task_id,),
        ).fetchone()

        if existing is None:
            return {"error": f"Task with ID {task_id} was not found."}

        connection.execute(
            f"UPDATE tasks SET {', '.join(updates)} WHERE id = ?",
            parameters,
        )

        row = connection.execute(
            """
            SELECT id, title, description, completed, priority, due_date
            FROM tasks
            WHERE id = ?
            """,
            (task_id,),
        ).fetchone()

    return serialize_task(row)


def complete_task(task_id: int) -> dict:
    """Mark a task as completed."""
    with get_connection() as connection:
        cursor = connection.execute(
            "UPDATE tasks SET completed = 1 WHERE id = ?",
            (task_id,),
        )

        if cursor.rowcount == 0:
            return {"error": f"Task with ID {task_id} was not found."}

        row = connection.execute(
            """
            SELECT id, title, description, completed, priority, due_date
            FROM tasks
            WHERE id = ?
            """,
            (task_id,),
        ).fetchone()

    return serialize_task(row)


def delete_task(task_id: int) -> dict:
    """Permanently delete a task by its ID."""
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM tasks WHERE id = ?",
            (task_id,),
        )

        if cursor.rowcount == 0:
            return {"error": f"Task with ID {task_id} was not found."}

    return {
        "message": "Task deleted successfully.",
        "task_id": task_id,
    }


mcp.add_tool(get_tasks)
mcp.add_tool(get_task)
mcp.add_tool(create_task)
mcp.add_tool(update_task)
mcp.add_tool(complete_task)
mcp.add_tool(delete_task)


if __name__ == "__main__":
    initialize_database()
    mcp.run()
