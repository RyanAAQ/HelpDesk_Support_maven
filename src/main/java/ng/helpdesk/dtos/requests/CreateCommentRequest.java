package ng.helpdesk.dtos.requests;

import lombok.Data;

@Data
public class CreateCommentRequest {
    private String body;
    private String ticketId;
    /** ID of the user posting the comment — must be logged in (CUSTOMER, AGENT, or ADMIN) */
    private String userId;
}
