document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
            window.location.replace("index.html");
            return;
        }
    } catch (error) {
        console.error("Unable to check existing session:", error);
    }

    const form = document.getElementById("loginForm");
    const errorElement = document.getElementById("loginError");
    const button = document.getElementById("loginButton");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        errorElement.textContent = "";
        button.disabled = true;
        button.textContent = "Signing in...";

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: document.getElementById("username").value.trim(),
                    password: document.getElementById("password").value
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Unable to sign in.");
            window.location.replace("index.html");
        } catch (error) {
            errorElement.textContent = error.message || "Something went wrong. Please try again.";
        } finally {
            button.disabled = false;
            button.textContent = "Sign In";
        }
    });
});
