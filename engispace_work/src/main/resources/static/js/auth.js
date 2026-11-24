(async function protectEngiSpacePage() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    if (currentPage === "login.html") return;

    try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" });
        if (!response.ok) {
            window.location.replace("login.html");
            return;
        }

        const account = await response.json();
        const isAdmin = account.role === "ADMIN";
        document.documentElement.dataset.userRole = account.role || "USER";

        if (!isAdmin && (currentPage === "admin-users.html" || currentPage === "class-schedules.html")) {
            window.location.replace("index.html");
            return;
        }

        // Keep the regular-user menu focused on the tasks they use most.
        if (!isAdmin) {
            document.querySelectorAll(".admin-only-nav, .navigation a[href=\"classrooms.html\"], .navigation a[href=\"tree.html\"], .navigation a[href=\"class-schedules.html\"]").forEach(link => link.remove());
            if (currentPage === "classrooms.html" || currentPage === "tree.html" || currentPage === "class-schedules.html") {
                window.location.replace("index.html");
                return;
            }

            const welcomeTitle = document.getElementById("welcomeTitle");
            if (welcomeTitle) welcomeTitle.textContent = `Welcome, ${account.fullName || "there"}!`;
            if (currentPage === "schedules.html") { window.location.replace("availability.html"); return; }
        } else {
            if (currentPage === "schedules.html") { window.location.replace("availability.html"); return; }
        }

        const topbar = document.querySelector(".topbar");
        if (topbar && !document.getElementById("logoutButton")) {
            const accountArea = document.createElement("div");
            accountArea.className = "account-area";
            accountArea.innerHTML = `<span class="account-label">${escapeText(account.fullName)} · ${isAdmin ? "Admin" : "Regular User"}</span><button type="button" class="logout-btn" id="logoutButton">Log out</button>`;
            topbar.appendChild(accountArea);
            document.getElementById("logoutButton").addEventListener("click", async () => {
                try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); }
                finally { window.location.replace("login.html"); }
            });
        }

        // Highlight the active page after role-specific navigation labels are set.
        document.querySelectorAll(".nav-link").forEach(link => {
            link.classList.toggle("active", link.getAttribute("href") === currentPage);
        });
    } catch (error) {
        console.error("Authentication check failed:", error);
        window.location.replace("login.html");
    }

    function escapeText(value) {
        return String(value || "").replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[character]);
    }
})();
