package ng.helpdesk.utils;

import ng.helpdesk.data.models.Comment;
import ng.helpdesk.data.models.Ticket;
import ng.helpdesk.data.models.User;
import ng.helpdesk.dtos.responses.CommentResponse;
import ng.helpdesk.dtos.responses.TicketResponse;
import ng.helpdesk.dtos.responses.UserResponse;

import java.util.ArrayList;
import java.util.List;

public class Mapper {

    public static UserResponse mapToUser(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setLoggedIn(user.isLoggedIn());
        return response;
    }

    public static CommentResponse mapToComment(Comment comment) {
        CommentResponse response = new CommentResponse();
        response.setId(comment.getId());
        response.setBody(comment.getBody());
        response.setCreatedAt(comment.getCreatedAt());
        response.setTicketId(comment.getTicketId());
        response.setUserId(comment.getUserId());
        return response;
    }

    public static TicketResponse mapToTicket(Ticket ticket) {
        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId());
        response.setTitle(ticket.getTitle());
        response.setDescription(ticket.getDescription());
        response.setStatus(ticket.getStatus());
        response.setPriority(ticket.getPriority());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setCustomerId(ticket.getCustomerId());
        response.setAgentId(ticket.getAgentId());

        List<CommentResponse> commentResponses = new ArrayList<>();
        if (ticket.getComments() != null) {
            for (Comment comment : ticket.getComments()) {
                commentResponses.add(mapToComment(comment));
            }
        }
        response.setComments(commentResponses);

        return response;
    }
}
