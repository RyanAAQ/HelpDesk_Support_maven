package ng.helpdesk.controllers;

import ng.helpdesk.dtos.requests.CreateUserRequest;
import ng.helpdesk.dtos.requests.LoginUserRequest;
import ng.helpdesk.dtos.requests.LogoutUserRequest;
import ng.helpdesk.dtos.responses.UserResponse;
import ng.helpdesk.exceptions.InvalidCredentialsException;
import ng.helpdesk.exceptions.UserAlreadyExistsException;
import ng.helpdesk.exceptions.UserNotFoundException;
import ng.helpdesk.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/users")
public class UserController {

    private UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody CreateUserRequest request) {
        try {
            UserResponse response = userService.register(request);
            return ResponseEntity.status(201).body(response);
        } catch (UserAlreadyExistsException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginUserRequest request) {
        try {
            UserResponse response = userService.login(request);
            return ResponseEntity.ok(response);
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (InvalidCredentialsException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody LogoutUserRequest request) {
        try {
            userService.logout(request);
            return ResponseEntity.noContent().build();
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        try {
            UserResponse response = userService.getUserById(id);
            return ResponseEntity.ok(response);
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    /** Returns all users with the AGENT role. Used by the dashboard to populate the assign-agent dropdown. */
    @GetMapping("/agents")
    public ResponseEntity<List<UserResponse>> getAgents() {
        return ResponseEntity.ok(userService.getAgents());
    }
}
