package ng.helpdesk.dtos.requests;

import lombok.Data;

@Data
public class UpdateTicketStatusRequest {
    private String status;
}
