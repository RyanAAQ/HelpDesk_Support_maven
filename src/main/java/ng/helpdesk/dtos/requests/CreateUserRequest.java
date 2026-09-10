package ng.helpdesk.dtos.requests;

import lombok.Data;
import ng.helpdesk.data.models.Role;

@Data
public class CreateUserRequest {
    private String username;
    private String password;
    private String email;
    private Role role;
}
