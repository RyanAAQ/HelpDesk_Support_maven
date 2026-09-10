package ng.helpdesk.dtos.requests;

import lombok.Data;

@Data
public class CreateCommentRequest {
    private String body;
    private String ticketId;
<<<<<<< HEAD
    /** ID of the user posting the comment — must be logged in (CUSTOMER, AGENT, or ADMIN) */
=======
>>>>>>> f4ce8b4e73d6a19e14a22a11fbe9be3f777111de
    private String userId;
}
