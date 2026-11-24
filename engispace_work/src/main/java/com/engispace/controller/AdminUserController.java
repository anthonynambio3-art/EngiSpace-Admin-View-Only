package com.engispace.controller;

import com.engispace.auth.UserAccountService;
import com.engispace.model.UserAccount;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final UserAccountService users;
    public AdminUserController(UserAccountService users) { this.users = users; }

    @GetMapping
    public List<Map<String, Object>> getUsers() {
        return users.getAllUsers().stream().map(this::safeUser).toList();
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        try {
            UserAccount user = users.createRegularUser(body.get("username"), body.get("fullName"), body.get("password"));
            return ResponseEntity.ok(safeUser(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{username}/enabled")
    public ResponseEntity<?> setEnabled(@PathVariable String username, @RequestBody Map<String, Boolean> body) {
        boolean changed = users.setEnabled(username, Boolean.TRUE.equals(body.get("enabled")));
        if (!changed) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("message", "Account updated."));
    }

    private Map<String, Object> safeUser(UserAccount user) {
        return Map.of("username", user.getUsername(), "fullName", user.getFullName(),
                "role", user.getRole(), "enabled", user.isEnabled());
    }
}
