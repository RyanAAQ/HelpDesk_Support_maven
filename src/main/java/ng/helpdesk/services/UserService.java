package ng.helpdesk.services;

import ng.helpdesk.data.models.Role;
import ng.helpdesk.data.models.User;
import ng.helpdesk.data.repositories.UserRepository;
import ng.helpdesk.dtos.requests.CreateUserRequest;
import ng.helpdesk.dtos.requests.LoginUserRequest;
import ng.helpdesk.dtos.requests.LogoutUserRequest;
import ng.helpdesk.dtos.responses.UserResponse;
import ng.helpdesk.exceptions.InvalidCredentialsException;
import ng.helpdesk.exceptions.UserAlreadyExistsException;
import ng.helpdesk.exceptions.UserNotFoundException;
import ng.helpdesk.utils.Mapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse register(CreateUserRequest request) {
        Optional<User> existing = userRepository.findByEmail(request.getEmail());
        if (existing.isPresent()) {
            throw new UserAlreadyExistsException("Email already exists");
        }

        User user = new User();
        user.setName(request.getUsername());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setRole(request.getRole());
        user.setLoggedIn(false);
        userRepository.save(user);

        return Mapper.mapToUser(user);
    }

    public UserResponse login(LoginUserRequest request) {
        Optional<User> found = userRepository.findByUsername(request.getUsername());
        if (found.isEmpty()) {
            throw new UserNotFoundException("User not found");
        }

        User user = found.get();
        if (!user.getPassword().equals(request.getPassword())) {
            throw new InvalidCredentialsException("Incorrect password");
        }

        user.setLoggedIn(true);
        userRepository.save(user);

        return Mapper.mapToUser(user);
    }

    public UserResponse logout(LogoutUserRequest request) {
        Optional<User> found = userRepository.findByUsername(request.getUsername());
        if (found.isEmpty()) {
            throw new UserNotFoundException("User not found");
        }
        User user = found.get();
        user.setLoggedIn(false);
        userRepository.save(user);
        return null;
    }

    public UserResponse getUserById(String id) {
        Optional<User> found = userRepository.findById(id);
        if (found.isEmpty()) {
            throw new UserNotFoundException("User not found");
        }
        return Mapper.mapToUser(found.get());
    }

    /** Returns all users with the AGENT role — used to populate the assign-agent dropdown. */
    public List<UserResponse> getAgents() {
        return userRepository.findByRole(Role.AGENT)
                .stream()
                .map(Mapper::mapToUser)
                .toList();
    }
}
