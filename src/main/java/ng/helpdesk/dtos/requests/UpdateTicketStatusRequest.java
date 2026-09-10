package ng.helpdesk.dtos.requests;

import lombok.Data;

@Data
public class UpdateTicketStatusRequest {
    private String status;
<<<<<<< HEAD
    /** ID of the user making this request — must be AGENT or ADMIN */
    private String callerId;
=======
>>>>>>> f4ce8b4e73d6a19e14a22a11fbe9be3f777111de
}
