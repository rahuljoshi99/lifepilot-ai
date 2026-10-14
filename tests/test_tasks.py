
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"] == "LifePilot AI is running"


def test_list_tasks():
    response = client.get("/tasks")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_task():
    response = client.post(
        "/tasks",
        json={
            "title": "Automated Test Task",
            "description": "Created using Pytest",
            "priority": "high",
            "due_date": None,
        },
    )

    assert response.status_code == 201
    assert response.json()["title"] == "Automated Test Task"
    assert response.json()["priority"] == "high"


def test_get_nonexistent_task():
    response = client.get("/tasks/999999")

    assert response.status_code == 404


def test_update_task():
    # Create a task first.
    create_response = client.post(
        "/tasks",
        json={
            "title": "Task Before Update",
            "description": "Original description",
            "priority": "medium",
            "due_date": None,
        },
    )

    assert create_response.status_code == 201
    task_id = create_response.json()["id"]

    # Update the task.
    update_response = client.patch(
        f"/tasks/{task_id}",
        json={
            "title": "Task After Update",
            "completed": True,
        },
    )

    assert update_response.status_code == 200
    assert update_response.json()["title"] == "Task After Update"
    assert update_response.json()["completed"] is True


def test_delete_task():
    # Create a task first.
    create_response = client.post(
        "/tasks",
        json={
            "title": "Task To Delete",
            "description": "Delete test",
            "priority": "low",
            "due_date": None,
        },
    )

    assert create_response.status_code == 201
    task_id = create_response.json()["id"]

    # Delete the task.
    delete_response = client.delete(f"/tasks/{task_id}")

    assert delete_response.status_code == 200

    # Verify that the task no longer exists.
    get_response = client.get(f"/tasks/{task_id}")
    assert get_response.status_code == 404


def test_task_priority_values():
    priorities = ["low", "medium", "high"]

    for priority in priorities:
        response = client.post(
            "/tasks",
            json={
                "title": f"{priority.title()} Priority Task",
                "description": "Testing priority handling",
                "priority": priority,
                "due_date": None,
            },
        )

        assert response.status_code == 201
        assert response.json()["priority"] == priority


def test_task_completion_status():
    create_response = client.post(
        "/tasks",
        json={
            "title": "Completion Test Task",
            "description": "Testing completion status",
            "priority": "medium",
            "due_date": None,
        },
    )

    assert create_response.status_code == 201
    task_id = create_response.json()["id"]

    update_response = client.patch(
        f"/tasks/{task_id}",
        json={"completed": True},
    )

    assert update_response.status_code == 200
    assert update_response.json()["completed"] is True
