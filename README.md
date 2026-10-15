# LifePilot AI

**An agentic personal productivity assistant powered by AI and the Model Context Protocol (MCP).**

LifePilot AI helps users manage their tasks through a web interface and AI-powered interactions. Its backend uses FastAPI, SQLite for task persistence, and an MCP server that exposes task-management capabilities as tools.

## Features

- **Task management:** Create, retrieve, update, complete, and delete tasks.
- **Task prioritization:** Organize tasks by low, medium, and high priority.
- **Due dates:** Assign due dates to tasks.
- **Persistent storage:** Store tasks in a SQLite database.
- **AI integration:** Connect the application to a locally running Ollama model.
- **MCP integration:** Expose task operations through six MCP tools.
- **Automated tests:** Test core application functionality with pytest.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend API | Python, FastAPI |
| Database | SQLite |
| AI model runtime | Ollama |
| Language model | Qwen 2.5 3B |
| AI tool integration | Model Context Protocol (MCP) |
| Testing | pytest |

## Architecture

1. The frontend provides the user interface for productivity and task management.
2. The FastAPI backend handles application requests.
3. SQLite stores task data persistently.
4. The AI service connects to the locally running Ollama model.
5. The MCP server exposes task operations as callable tools for compatible MCP clients.

## MCP Tools

LifePilot AI currently exposes six MCP tools:

| Tool | Description |
|---|---|
| `get_tasks` | Retrieve tasks, optionally filtered by completion status and priority. |
| `get_task` | Retrieve an individual task by ID. |
| `create_task` | Create a task with optional details and a due date. |
| `update_task` | Update supported task fields. |
| `complete_task` | Mark a task as completed. |
| `delete_task` | Permanently delete a task. |

## Local Setup

### Prerequisites

- Python 3.13 or a compatible Python version
- Git
- Ollama
- The Qwen 2.5 3B model

### 1. Clone the repository

```bash
git clone https://github.com/rahuljoshi99/lifepilot-ai.git
cd lifepilot-ai
```

### 2. Create and activate a virtual environment

Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Set up the local AI model

Install Ollama, then run:

```bash
ollama pull qwen2.5:3b
ollama serve
```

If Ollama is already running as a background service, you do not need to start it again.

### 5. Start the backend

From the project root:

```bash
python -m uvicorn backend.app.main:app --reload
```

The API should be available at:

`http://127.0.0.1:8000`

Interactive API documentation:

`http://127.0.0.1:8000/docs`

### 6. Open the frontend

Open `frontend/index.html` using VS Code Live Server, or another local static web server.

Verify that the frontend API configuration points to the running backend.

## Testing

Run the automated test suite:

```bash
python -m pytest -q
```

The current verified result is **8 tests passed**.

To test the MCP server with the included client:

```bash
python test_mcp_client.py
```

The MCP client has successfully verified task creation, updating, completion, retrieval, deletion, and deletion confirmation.

## Project Status

- Core task-management functionality: implemented.
- SQLite persistence: implemented.
- Local AI integration: implemented.
- MCP task tools: implemented and manually verified.
- Automated tests: 8 passing in the latest recorded run.
- Public deployment: pending verification.

## Repository

[GitHub — LifePilot AI](https://github.com/rahuljoshi99/lifepilot-ai)

## Future Improvements

- Deploy the application for public access.
- Configure production environment variables and secure API access.
- Improve AI-driven task planning and multi-step workflows.
- Add further automated integration tests.
- Provide hosted access to the AI functionality without requiring users to run a local model.