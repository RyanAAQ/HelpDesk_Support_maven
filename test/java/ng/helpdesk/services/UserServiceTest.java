package ng.helpdesk.services;

import ng.helpdesk.data.models.Role;
import ng.helpdesk.data.repositories.UserRepository;
import ng.helpdesk.dtos.requests.CreateUserRequest;
import ng.helpdesk.dtos.requests.LoginUserRequest;
import ng.helpdesk.dtos.requests.LogoutUserRequest;
import ng.helpdesk.dtos.responses.UserResponse;
import ng.helpdesk.exceptions.InvalidCredentialsException;
import ng.helpdesk.exceptions.UserAlreadyExistsException;
import ng.helpdesk.exceptions.UserNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    private CreateUserRequest registerUser() {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("johndoe");
        request.setEmail("john@example.com");
        request.setPassword("pass123");
        request.setRole(Role.CUSTOMER);
        return request;
    }

    @Test
    void registerSavesUserAndReturnsResponse() {
        UserResponse response = userService.register(registerUser());

        assertNotNull(response);
        assertEquals("john@example.com", response.getEmail());
        assertEquals(Role.CUSTOMER, response.getRole());
        assertFalse(response.isLoggedIn());
        assertEquals(1, userRepository.count());
    }

    @Test
    void registerThrowsWhenEmailAlreadyExists() {
        userService.register(registerUser());

        assertThrows(UserAlreadyExistsException.class, () -> userService.register(registerUser()));
        assertEquals(1, userRepository.count());
    }

    @Test
    void loginSetsUserAsLoggedIn() {
        userService.register(registerUser());

        LoginUserRequest login = new LoginUserRequest();
        login.setUsername("johndoe");
        login.setPassword("pass123");

        UserResponse response = userService.login(login);

        assertNotNull(response);
        assertTrue(response.isLoggedIn());
    }

    @Test
    void loginThrowsForUnknownUsername() {
        LoginUserRequest login = new LoginUserRequest();
        login.setUsername("nobody");
        login.setPassword("pass123");

        assertThrows(UserNotFoundException.class, () -> userService.login(login));
    }

    @Test
    void loginThrowsForWrongPassword() {
        userService.register(registerUser());

        LoginUserRequest login = new LoginUserRequest();
        login.setUsername("johndoe");
        login.setPassword("wrongpass");

        assertThrows(InvalidCredentialsException.class, () -> userService.login(login));
    }

    @Test
    void logoutThrowsForUnknownUsername() {
        LogoutUserRequest logout = new LogoutUserRequest();
        logout.setUsername("nobody");

        assertThrows(UserNotFoundException.class, () -> userService.logout(logout));
    }

    @Test
    void getUserByIdReturnsCorrectUser() {
        userService.register(registerUser());
        String id = userRepository.findByUsername("johndoe").get().getId();

        UserResponse response = userService.getUserById(id);

        assertNotNull(response);
        assertEquals("john@example.com", response.getEmail());
    }

    @Test
    void getUserByIdThrowsWhenNotFound() {
        assertThrows(UserNotFoundException.class, () -> userService.getUserById("nonexistent-id"));
    }
}
