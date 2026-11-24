package com.engispace.auth;

import com.engispace.model.UserAccount;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class UserAccountService implements UserDetailsService {
    private final ObjectMapper mapper = new ObjectMapper();
    private final PasswordEncoder passwordEncoder;
    private final File file;

    @Value("${engispace.admin.username:admin}")
    private String adminUsername;

    @Value("${engispace.admin.password:ChangeMe123!}")
    private String adminPassword;

    public UserAccountService(PasswordEncoder passwordEncoder,
            @Value("${engispace.users-file:src/main/resources/data/users.json}") String usersFile) {
        this.passwordEncoder = passwordEncoder;
        this.file = new File(usersFile);
    }

    @PostConstruct
    public synchronized void initializeAdmin() {
        List<UserAccount> users = readUsers();
        boolean adminExists = users.stream().anyMatch(u -> u.getUsername().equalsIgnoreCase(adminUsername));
        if (!adminExists) {
            users.add(new UserAccount(adminUsername, "EngiSpace Administrator",
                    passwordEncoder.encode(adminPassword), "ADMIN", true));
            writeUsers(users);
        }
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserAccount account = findByUsername(username);
        if (account == null || !account.isEnabled()) {
            throw new UsernameNotFoundException("Account not found or disabled.");
        }
        return User.withUsername(account.getUsername())
                .password(account.getPassword())
                .roles(account.getRole())
                .build();
    }

    public synchronized UserAccount findByUsername(String username) {
        return readUsers().stream()
                .filter(u -> u.getUsername().equalsIgnoreCase(username))
                .findFirst().orElse(null);
    }

    public synchronized List<UserAccount> getAllUsers() {
        return readUsers();
    }

    public synchronized UserAccount createRegularUser(String username, String fullName, String rawPassword) {
        if (username == null || username.isBlank() || fullName == null || fullName.isBlank()
                || rawPassword == null || rawPassword.length() < 8) {
            throw new IllegalArgumentException("Enter a username, full name, and a password with at least 8 characters.");
        }
        if (findByUsername(username) != null) {
            throw new IllegalArgumentException("That username is already registered.");
        }
        UserAccount account = new UserAccount(username.trim(), fullName.trim(),
                passwordEncoder.encode(rawPassword), "USER", true);
        List<UserAccount> users = readUsers();
        users.add(account);
        writeUsers(users);
        return account;
    }

    public synchronized boolean setEnabled(String username, boolean enabled) {
        List<UserAccount> users = readUsers();
        for (UserAccount user : users) {
            if (user.getUsername().equalsIgnoreCase(username) && !"ADMIN".equals(user.getRole())) {
                user.setEnabled(enabled);
                writeUsers(users);
                return true;
            }
        }
        return false;
    }

    private List<UserAccount> readUsers() {
        try {
            if (!file.exists()) return new ArrayList<>();
            return mapper.readValue(file, new TypeReference<List<UserAccount>>() {});
        } catch (IOException e) {
            throw new IllegalStateException("Unable to read user accounts file.", e);
        }
    }

    private void writeUsers(List<UserAccount> users) {
        try {
            File parent = file.getParentFile();
            if (parent != null) parent.mkdirs();
            mapper.writerWithDefaultPrettyPrinter().writeValue(file, users);
        } catch (IOException e) {
            throw new IllegalStateException("Unable to save user accounts.", e);
        }
    }
}
