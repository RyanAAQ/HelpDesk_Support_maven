package ng.helpdesk.dtos.requests;

import lombok.Data;

@Data
public class AssignAgentRequest {
    private String agentId;
    /** ID of the user making this request — must be AGENT or ADMIN */
    private String callerId;
}
