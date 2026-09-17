package ng.helpdesk.services;

import lombok.AllArgsConstructor;
import ng.helpdesk.data.models.Comment;
import ng.helpdesk.data.repositories.CommentRepository;
import ng.helpdesk.data.repositories.TicketRepository;
import ng.helpdesk.data.repositories.UserRepository;
import ng.helpdesk.dtos.requests.CreateCommentRequest;
import ng.helpdesk.dtos.responses.CommentResponse;
import ng.helpdesk.exceptions.TicketNotFoundException;
import ng.helpdesk.exceptions.UserNotFoundException;
import ng.helpdesk.utils.Mapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class CommentService {

    private CommentRepository commentRepository;
    private TicketRepository ticketRepository;
    private UserRepository userRepository;

    public CommentResponse postComment(CreateCommentRequest request) {
        var ticketOpt = ticketRepository.findById(request.getTicketId());
        if (ticketOpt.isEmpty()) {
            throw new TicketNotFoundException("Ticket not found");
        }
        if (userRepository.findById(request.getUserId()).isEmpty()) {
            throw new UserNotFoundException("User not found");
        }

        Comment comment = new Comment();
        comment.setBody(request.getBody());
        comment.setTicketId(request.getTicketId());
        comment.setUserId(request.getUserId());
        comment.setCreatedAt(LocalDateTime.now());
        commentRepository.save(comment);

        var ticket = ticketOpt.get();
        if (ticket.getComments() == null) {
            ticket.setComments(new ArrayList<>());
        }
        ticket.getComments().add(comment);
        ticketRepository.save(ticket);

        return Mapper.mapToComment(comment);
    }

    public List<CommentResponse> getCommentsByTicket(String ticketId) {
        List<Comment> comments = commentRepository.findByTicketId(ticketId);
        List<CommentResponse> result = new ArrayList<>();
        for (Comment comment : comments) {
            result.add(Mapper.mapToComment(comment));
        }
        return result;
    }
}
