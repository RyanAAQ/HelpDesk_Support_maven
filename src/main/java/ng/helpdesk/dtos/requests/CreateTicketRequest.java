package ng.helpdesk.dtos.requests;

import lombok.Data;

@Data
public class CreateTicketRequest {
    private String title;
    private String description;
    private String priority;
    private String customerId;
}
