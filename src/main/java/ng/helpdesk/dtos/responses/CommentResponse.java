package ng.helpdesk.dtos.responses;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentResponse {
    private String id;
    private String body;
    private LocalDateTime createdAt;
    private String ticketId;
    private String userId;
}
