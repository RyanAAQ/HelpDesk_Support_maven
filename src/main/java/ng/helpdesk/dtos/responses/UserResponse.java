package ng.helpdesk.dtos.responses;

import lombok.Data;
import ng.helpdesk.data.models.Role;

@Data
public class UserResponse {
    private String id;
    private String name;
    private String username;
    private String email;
    private Role role;
    private boolean loggedIn;
}
