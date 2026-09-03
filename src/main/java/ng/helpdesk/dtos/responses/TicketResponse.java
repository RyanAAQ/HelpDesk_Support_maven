package ng.helpdesk.dtos.responses;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TicketResponse {
    private String id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private List<CommentResponse> comments;
    private LocalDateTime createdAt;
    private String customerId;
    private String agentId;
}
