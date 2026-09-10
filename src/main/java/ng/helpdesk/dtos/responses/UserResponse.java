package ng.helpdesk.dtos.responses;

import lombok.Data;
import ng.helpdesk.data.models.Role;

@Data
public class UserResponse {
    private String id;
    private String name;
<<<<<<< HEAD
    private String username;
=======
>>>>>>> f4ce8b4e73d6a19e14a22a11fbe9be3f777111de
    private String email;
    private Role role;
    private boolean loggedIn;
}
