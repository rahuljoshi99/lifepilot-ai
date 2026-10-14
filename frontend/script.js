
const API_URL = "http://127.0.0.1:8000";

// Form elements
const taskForm = document.getElementById("task-form");
const taskTitle = document.getElementById("task-title");
const taskDescription = document.getElementById("task-description");
const taskPriority = document.getElementById("task-priority");
const taskDueDate = document.getElementById("task-due-date");

// Task display and filters
const taskList = document.getElementById("task-list");
const statusFilter = document.getElementById("status-filter");
const priorityFilter = document.getElementById("priority-filter");
const message = document.getElementById("message");

// Dashboard statistics
const totalTasksElement = document.getElementById("total-tasks");
const completedTasksElement = document.getElementById("completed-tasks");
const pendingTasksElement = document.getElementById("pending-tasks");

// API status elements
const apiStatus = document.getElementById("api-status");
const apiStatusDot = document.getElementById("api-status-dot");
const apiStatusText = document.getElementById("api-status-text");

let tasks = [];
let editingTaskId = null;

// Display success and error messages.
function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#f87171" : "#34d399";
}

// Update the API connection badge without duplicating its text.
function setApiStatus(connected) {
    if (!apiStatus) {
        return;
    }

    apiStatus.classList.toggle("connected", connected);
    apiStatus.classList.toggle("disconnected", !connected);

    apiStatus.setAttribute(
        "aria-label",
        connected ? "API Connected" : "API Disconnected"
    );

    if (apiStatusDot) {
        apiStatusDot.style.backgroundColor = connected
            ? "#34d399"
            : "#f87171";
    }

    // Update the dedicated text element in index.html.
    if (apiStatusText) {
        apiStatusText.textContent = connected
            ? "API Connected"
            : "API Disconnected";
    }
}

// Restore the form to create-task mode.
function resetTaskForm() {
    taskForm.reset();
    editingTaskId = null;
    delete taskForm.dataset.editingTaskId;

    const submitButton = taskForm.querySelector(
        'button[type="submit"]'
    );

    if (submitButton) {
        submitButton.textContent = "+ Add Task";
    }

    const cancelButton = document.getElementById("cancel-edit-button");

    if (cancelButton) {
        cancelButton.remove();
    }
}

// Load tasks and update the connection status.
async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`);

        if (!response.ok) {
            setApiStatus(false);
            throw new Error("Could not load tasks.");
        }

        tasks = await response.json();

        setApiStatus(true);
        renderTasks();
    } catch (error) {
        console.error("Load tasks error:", error);
        setApiStatus(false);

        showMessage(
            "Unable to connect to the backend. Make sure FastAPI is running.",
            true
        );
    }
}

// Render dashboard statistics and task cards.
function renderTasks() {
    taskList.replaceChildren();

    totalTasksElement.textContent = tasks.length;

    const completedCount = tasks.filter(
        task => task.completed
    ).length;

    completedTasksElement.textContent = completedCount;
    pendingTasksElement.textContent = tasks.length - completedCount;

    if (tasks.length === 0) {
        const emptyState = document.createElement("p");
        emptyState.className = "empty-state";
        emptyState.textContent = "No tasks yet. Add your first task above!";
        taskList.appendChild(emptyState);
        return;
    }

    const selectedStatus = statusFilter.value.trim().toLowerCase();
    const selectedPriority = priorityFilter.value.trim().toLowerCase();

    const filteredTasks = tasks.filter(task => {
        const matchesStatus =
            selectedStatus === "all" ||
            (selectedStatus === "completed" && task.completed) ||
            (selectedStatus === "pending" && !task.completed);

        const taskPriorityValue = String(task.priority || "medium")
            .trim()
            .toLowerCase();

        const matchesPriority =
            selectedPriority === "all" ||
            taskPriorityValue === selectedPriority;

        return matchesStatus && matchesPriority;
    });

    if (filteredTasks.length === 0) {
        const emptyState = document.createElement("p");
        emptyState.className = "empty-state";
        emptyState.textContent = "No tasks match your selected filters.";
        taskList.appendChild(emptyState);
        return;
    }

    filteredTasks.forEach(task => {
        const item = document.createElement("article");
        item.className = "task-item";

        if (task.completed) {
            item.classList.add("completed");
        }

        // Completion checkbox.
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;

        checkbox.setAttribute(
            "aria-label",
            `Mark ${task.title} as ${
                task.completed ? "pending" : "completed"
            }`
        );

        checkbox.addEventListener("change", () => {
            updateTask(task.id, {
                completed: checkbox.checked
            });
        });

        // Task details.
        const details = document.createElement("div");
        details.className = "task-details";

        const title = document.createElement("h3");
        title.textContent = task.title;

        const description = document.createElement("p");
        description.textContent = task.description || "No description";

        // Priority and due-date metadata.
        const metadata = document.createElement("div");
        metadata.className = "task-metadata";

        const priority = document.createElement("span");

        const priorityValue = ["low", "medium", "high"].includes(
            task.priority
        )
            ? task.priority
            : "medium";

        priority.className = `priority-badge priority-${priorityValue}`;

        priority.textContent =
            priorityValue.charAt(0).toUpperCase() +
            priorityValue.slice(1) +
            " Priority";

        metadata.appendChild(priority);

        if (task.due_date) {
            const dueDate = document.createElement("span");
            dueDate.className = "task-due-date";

            const parsedDate = new Date(`${task.due_date}T00:00:00`);

            dueDate.textContent = Number.isNaN(parsedDate.getTime())
                ? `Due: ${task.due_date}`
                : `Due: ${parsedDate.toLocaleDateString("en-IN")}`;

            metadata.appendChild(dueDate);
        }

        details.append(title, description, metadata);

        // Edit button.
        const editButton = document.createElement("button");
        editButton.className = "edit-button";
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.setAttribute("aria-label", `Edit ${task.title}`);

        editButton.addEventListener("click", () => {
            editTask(task);
        });

        // Delete button.
        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", `Delete ${task.title}`);

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        item.append(checkbox, details, editButton, deleteButton);
        taskList.appendChild(item);
    });
}

// Populate the form with an existing task.
function editTask(task) {
    editingTaskId = task.id;
    taskForm.dataset.editingTaskId = task.id;

    taskTitle.value = task.title;
    taskDescription.value = task.description || "";
    taskPriority.value = task.priority || "medium";
    taskDueDate.value = task.due_date || "";

    const submitButton = taskForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.textContent = "Save Changes";

    let cancelButton = document.getElementById("cancel-edit-button");

    if (!cancelButton) {
        cancelButton = document.createElement("button");
        cancelButton.id = "cancel-edit-button";
        cancelButton.type = "button";
        cancelButton.textContent = "Cancel Edit";
        cancelButton.className = "edit-button";

        submitButton.insertAdjacentElement("afterend", cancelButton);

        cancelButton.addEventListener("click", () => {
            resetTaskForm();
            showMessage("Edit cancelled.");
        });
    }

    taskForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    taskTitle.focus();
    showMessage(`Editing: ${task.title}`);
}

// Re-render when filters change.
statusFilter.addEventListener("change", renderTasks);
priorityFilter.addEventListener("change", renderTasks);

// Create a new task or save edits to an existing task.
taskForm.addEventListener("submit", async event => {
    event.preventDefault();

    const title = taskTitle.value.trim();
    const description = taskDescription.value.trim();
    const priority = taskPriority.value;
    const dueDate = taskDueDate.value;

    if (!title) {
        showMessage("Please enter a task title.", true);
        taskTitle.focus();
        return;
    }

    const isEditing = editingTaskId !== null;

    const url = isEditing
        ? `${API_URL}/tasks/${editingTaskId}`
        : `${API_URL}/tasks`;

    const method = isEditing ? "PATCH" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                description,
                priority,
                due_date: dueDate || null
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            throw new Error(
                errorData.detail
                    ? JSON.stringify(errorData.detail)
                    : isEditing
                        ? "Could not update task."
                        : "Could not create task."
            );
        }

        setApiStatus(true);
        resetTaskForm();

        showMessage(
            isEditing
                ? "Task updated successfully!"
                : "Task added successfully!"
        );

        await loadTasks();
    } catch (error) {
        console.error(
            isEditing ? "Update task error:" : "Create task error:",
            error
        );

        // A failed write doesn't necessarily mean the API is offline.
        await checkApiConnection();

        showMessage(
            error.message || "Operation failed. Please try again.",
            true
        );
    }
});

// Update task fields, such as completion status.
async function updateTask(taskId, changes) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(changes)
        });

        if (!response.ok) {
            throw new Error("Could not update task.");
        }

        setApiStatus(true);
        showMessage("Task updated successfully!");
        await loadTasks();
    } catch (error) {
        console.error("Update task error:", error);
        await checkApiConnection();
        showMessage("Failed to update task.", true);
        await loadTasks();
    }
}

// Delete a task.
async function deleteTask(taskId) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Could not delete task.");
        }

        setApiStatus(true);

        if (editingTaskId === taskId) {
            resetTaskForm();
        }

        showMessage("Task deleted successfully!");
        await loadTasks();
    } catch (error) {
        console.error("Delete task error:", error);
        await checkApiConnection();
        showMessage("Failed to delete task.", true);
    }
}

// Check backend availability independently.
async function checkApiConnection() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: "GET",
            cache: "no-store"
        });

        setApiStatus(response.ok);
        return response.ok;
    } catch (error) {
        setApiStatus(false);
        return false;
    }
}

// Load tasks when the page opens.
loadTasks();

// Recheck periodically so the badge changes if the backend stops or restarts.
setInterval(checkApiConnection, 5000);




/* =========================
   LIFE PILOT AI CHAT
========================= */

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const chatSendButton = document.getElementById("chat-send-button");
const chatStatus = document.getElementById("chat-status");

// Scroll only the chat panel, not the entire page.
function scrollChatToBottom(behavior = "smooth") {
    requestAnimationFrame(() => {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior
        });
    });
}

// Safely render basic Markdown without inserting raw HTML.

function renderMarkdown(container, markdown) {
    container.replaceChildren();

    const lines = String(markdown || "")
        .replace(/\r\n/g, "\n")
        .split("\n");

    // Convert a numbered conclusion into a normal paragraph.
    for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].replace(
            /^(\s*)\d+[.)]\s+(Conclusion|Conclude)\s*:\s*/i,
            "$1$2: "
        );
    }

    let index = 0;
    const seenHeadings = new Set();

    function appendInline(parent, text) {
        const pattern = /(\*\*.+?\*\*|`[^`]+`|\*[^*\n]+\*)/g;
        let lastIndex = 0;
        let match;

        while ((match = pattern.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parent.appendChild(
                    document.createTextNode(
                        text.slice(lastIndex, match.index)
                    )
                );
            }

            const token = match[0];
            let element;

            if (token.startsWith("**")) {
                element = document.createElement("strong");
                element.textContent = token.slice(2, -2);
            } else if (token.startsWith("`")) {
                element = document.createElement("code");
                element.textContent = token.slice(1, -1);
            } else {
                element = document.createElement("em");
                element.textContent = token.slice(1, -1);
            }

            parent.appendChild(element);
            lastIndex = pattern.lastIndex;
        }

        if (lastIndex < text.length) {
            parent.appendChild(
                document.createTextNode(text.slice(lastIndex))
            );
        }
    }

    function isBlank(line) {
        return !line.trim();
    }

    function isListItem(line) {
        return /^\s*([-*+]|\d+[.)])\s+/.test(line);
    }

    function isNumberedItem(line) {
        return /^\s*\d+[.)]\s+/.test(line);
    }

    function cleanDescription(line) {
        return line.replace(/^\s*:\s*/, "").trim();
    }

    while (index < lines.length) {
        const line = lines[index];

        if (isBlank(line)) {
            index++;
            continue;
        }

        // Fenced code blocks.
        if (/^\s*```/.test(line)) {
            const codeLines = [];
            index++;

            while (
                index < lines.length &&
                !/^\s*```/.test(lines[index])
            ) {
                codeLines.push(lines[index]);
                index++;
            }

            if (index < lines.length) {
                index++;
            }

            const pre = document.createElement("pre");
            const code = document.createElement("code");
            code.textContent = codeLines.join("\n");
            pre.appendChild(code);
            container.appendChild(pre);
            continue;
        }

        // Headings. Skip repeated headings such as a duplicated title.
        const headingMatch = line.match(/^\s*(#{1,6})\s+(.+)$/);

        if (headingMatch) {
            const headingText = headingMatch[2].trim();
            const headingKey = headingText.toLowerCase();

            if (!seenHeadings.has(headingKey)) {
                const heading = document.createElement(
                    `h${headingMatch[1].length}`
                );

                appendInline(heading, headingText);
                container.appendChild(heading);
                seenHeadings.add(headingKey);
            }

            index++;
            continue;
        }

        // Numbered lists with explanations nested under each step.
        if (isNumberedItem(line)) {
            const list = document.createElement("ol");

            while (index < lines.length) {
                if (isBlank(lines[index])) {
                    index++;
                    continue;
                }

                // A numbered item starts the next step in the same list.
                if (isNumberedItem(lines[index])) {
                    const match = lines[index].match(
                        /^\s*\d+[.)]\s+(.*)$/
                    );

                    const item = document.createElement("li");
                    appendInline(item, match[1].trim());
                    list.appendChild(item);
                    index++;

                    // Attach colon-prefixed descriptions to this step.
                    while (
                        index < lines.length &&
                        /^\s*:/.test(lines[index])
                    ) {
                        const descriptionText =
                            cleanDescription(lines[index]);

                        if (descriptionText) {
                            const description =
                                document.createElement("p");

                            appendInline(description, descriptionText);
                            item.appendChild(description);
                        }

                        index++;
                    }

                    // Attach bullet explanations as a nested list.
                    while (
                        index < lines.length &&
                        /^\s*[-*+]\s+/.test(lines[index])
                    ) {
                        const bulletMatch = lines[index].match(
                            /^\s*[-*+]\s+(.*)$/
                        );

                        let nestedList =
                            item.querySelector("ul");

                        if (!nestedList) {
                            nestedList = document.createElement("ul");
                            item.appendChild(nestedList);
                        }

                        const bullet = document.createElement("li");
                        appendInline(
                            bullet,
                            bulletMatch[1].trim()
                        );

                        nestedList.appendChild(bullet);
                        index++;

                        // Handle colon descriptions following a bullet.
                        while (
                            index < lines.length &&
                            /^\s*:/.test(lines[index])
                        ) {
                            const descriptionText =
                                cleanDescription(lines[index]);

                            if (descriptionText) {
                                const description =
                                    document.createElement("p");

                                appendInline(
                                    description,
                                    descriptionText
                                );

                                bullet.appendChild(description);
                            }

                            index++;
                        }
                    }

                    continue;
                }

                // A colon description can follow a numbered item
                // even if the model inserted a blank line.
                if (/^\s*:/.test(lines[index])) {
                    const lastItem = list.lastElementChild;
                    const descriptionText =
                        cleanDescription(lines[index]);

                    if (lastItem && descriptionText) {
                        const description =
                            document.createElement("p");

                        appendInline(description, descriptionText);
                        lastItem.appendChild(description);
                    }

                    index++;
                    continue;
                }

                // A bullet list by itself belongs to the current step.
                if (/^\s*[-*+]\s+/.test(lines[index])) {
                    const lastItem = list.lastElementChild;

                    if (!lastItem) {
                        break;
                    }

                    let nestedList = lastItem.querySelector("ul");

                    if (!nestedList) {
                        nestedList = document.createElement("ul");
                        lastItem.appendChild(nestedList);
                    }

                    const bulletMatch = lines[index].match(
                        /^\s*[-*+]\s+(.*)$/
                    );

                    const bullet = document.createElement("li");
                    appendInline(bullet, bulletMatch[1].trim());
                    nestedList.appendChild(bullet);
                    index++;
                    continue;
                }

                break;
            }

            container.appendChild(list);
            continue;
        }

        // Ordinary bullet lists.
        if (/^\s*[-*+]\s+/.test(line)) {
            const list = document.createElement("ul");

            while (
                index < lines.length &&
                /^\s*[-*+]\s+/.test(lines[index])
            ) {
                const match = lines[index].match(
                    /^\s*[-*+]\s+(.*)$/
                );

                const item = document.createElement("li");
                appendInline(item, match[1].trim());
                list.appendChild(item);
                index++;

                while (
                    index < lines.length &&
                    /^\s*:/.test(lines[index])
                ) {
                    const descriptionText =
                        cleanDescription(lines[index]);

                    if (descriptionText) {
                        const description =
                            document.createElement("p");

                        appendInline(description, descriptionText);
                        item.appendChild(description);
                    }

                    index++;
                }
            }

            container.appendChild(list);
            continue;
        }

        // Blockquotes.
        if (/^\s*>\s?/.test(line)) {
            const quoteLines = [];

            while (
                index < lines.length &&
                /^\s*>\s?/.test(lines[index])
            ) {
                quoteLines.push(
                    lines[index].replace(/^\s*>\s?/, "")
                );
                index++;
            }

            const quote = document.createElement("blockquote");
            appendInline(quote, quoteLines.join(" "));
            container.appendChild(quote);
            continue;
        }

        // Regular paragraphs.
        const paragraphLines = [line.trim()];
        index++;

        while (
            index < lines.length &&
            !isBlank(lines[index]) &&
            !/^\s*```/.test(lines[index]) &&
            !/^\s*#{1,6}\s+/.test(lines[index]) &&
            !isListItem(lines[index]) &&
            !/^\s*>\s?/.test(lines[index])
        ) {
            paragraphLines.push(lines[index].trim());
            index++;
        }

        const paragraph = document.createElement("p");
        appendInline(paragraph, paragraphLines.join(" "));
        container.appendChild(paragraph);
    }
}

function setChatMessageContent(messageElement, text) {
    const content = messageElement.querySelector(".chat-content");

    if (content) {
        renderMarkdown(content, text);
    }

    scrollChatToBottom();
}

function addChatMessage(sender, text) {
    const messageElement = document.createElement("div");

    messageElement.className =
        sender === "user"
            ? "chat-message user-message"
            : "chat-message assistant-message";

    const heading = document.createElement("strong");
    heading.textContent = sender === "user" ? "You" : "LifePilot AI";

    const content = document.createElement("div");
    content.className = "chat-content";

    renderMarkdown(content, text);

    messageElement.append(heading, content);
    chatMessages.appendChild(messageElement);

    scrollChatToBottom();

    return messageElement;
}

if (
    chatForm &&
    chatInput &&
    chatMessages &&
    chatSendButton &&
    chatStatus
) {
    chatForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const prompt = chatInput.value.trim();

        if (!prompt) {
            chatStatus.textContent = "Please enter a message.";
            chatStatus.style.color = "#f87171";
            return;
        }

        addChatMessage("user", prompt);

        chatInput.value = "";
        chatSendButton.disabled = true;
        chatSendButton.textContent = "Thinking...";

        chatStatus.textContent =
            "LifePilot AI is preparing a response...";
        chatStatus.style.color = "#94a3b8";

        const loadingMessage = addChatMessage(
            "assistant",
            "LifePilot is thinking…"
        );

        try {
            const response = await fetch(`${API_URL}/ai/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ prompt })
            });

            const responseText = await response.text();
            let data = {};

            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch {
                data = {};
            }

            if (!response.ok) {
                const detail =
                    typeof data.detail === "string"
                        ? data.detail
                        : `The server returned HTTP ${response.status}.`;

                throw new Error(detail);
            }

            const answer =
                typeof data.response === "string" &&
                data.response.trim()
                    ? data.response
                    : "The AI returned an empty response.";

            setChatMessageContent(loadingMessage, answer);

            chatStatus.textContent =
                `Answered by ${data.model || "LifePilot AI"}.`;
            chatStatus.style.color = "#34d399";
        } catch (error) {
            console.error("AI chat error:", error);

            const friendlyMessage =
                error instanceof TypeError
                    ? "I couldn't reach the backend. Make sure the FastAPI server is running, then try again."
                    : `I couldn't generate a response. ${error.message}`;

            setChatMessageContent(loadingMessage, friendlyMessage);

            chatStatus.textContent =
                "AI request failed. Check the backend and Ollama.";
            chatStatus.style.color = "#f87171";
        } finally {
            chatSendButton.disabled = false;
            chatSendButton.textContent = "Send Message";
            chatInput.focus();
        }
    });
}
