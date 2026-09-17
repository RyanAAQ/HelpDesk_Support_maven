package ng.helpdesk.dtos.requests;

import lombok.Data;

@Data
public class CreateCommentRequest {
    private String body;
    private String ticketId;
    /** ID of the user posting the comment */
    private String userId;
}
