document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
    document.getElementById("createUserForm").addEventListener("submit", createUser);
});

async function loadUsers() {
    const body = document.getElementById("usersTableBody");
    try {
        const response = await fetch("/api/admin/users");
        if (!response.ok) throw new Error("Unable to load user accounts.");
        const users = await response.json();
        body.replaceChildren();
        if (!users.length) {
            body.innerHTML = '<tr><td colspan="5" style="text-align:center">No accounts found.</td></tr>';
            return;
        }
        users.forEach(user => {
            const row = document.createElement("tr");
            [user.fullName, user.username, user.role, user.enabled ? "Active" : "Disabled"].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });
            const actionCell = document.createElement("td");
            if (user.role === "USER") {
                const button = document.createElement("button");
                button.className = "action-btn " + (user.enabled ? "delete-btn" : "edit-btn");
                button.textContent = user.enabled ? "Disable" : "Enable";
                button.addEventListener("click", () => setUserEnabled(user.username, !user.enabled));
                actionCell.appendChild(button);
            } else {
                actionCell.textContent = "Protected";
            }
            row.appendChild(actionCell);
            body.appendChild(row);
        });
    } catch (error) {
        body.innerHTML = `<tr><td colspan="5" class="tree-error">${error.message}</td></tr>`;
    }
}

async function createUser(event) {
    event.preventDefault();
    const message = document.getElementById("userFormMessage");
    const button = document.getElementById("createUserButton");
    message.textContent = "";
    button.disabled = true;
    try {
        const response = await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: document.getElementById("fullName").value.trim(),
                username: document.getElementById("newUsername").value.trim(),
                password: document.getElementById("newPassword").value
            })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to create account.");
        message.textContent = "Regular user account created successfully.";
        message.className = "form-message success-message";
        document.getElementById("createUserForm").reset();
        await loadUsers();
    } catch (error) {
        message.textContent = error.message;
        message.className = "form-message error-message";
    } finally {
        button.disabled = false;
    }
}

async function setUserEnabled(username, enabled) {
    if (!confirm(`${enabled ? "Enable" : "Disable"} this account?`)) return;
    const response = await fetch(`/api/admin/users/${encodeURIComponent(username)}/enabled`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
    });
    if (!response.ok) alert("Unable to update this account.");
    await loadUsers();
}
