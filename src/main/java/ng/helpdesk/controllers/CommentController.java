package ng.helpdesk.controllers;

import ng.helpdesk.dtos.requests.CreateCommentRequest;
import ng.helpdesk.dtos.responses.CommentResponse;
import ng.helpdesk.exceptions.TicketNotFoundException;
import ng.helpdesk.exceptions.UserNotFoundException;
import ng.helpdesk.services.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/comments")
public class CommentController {

    private CommentService commentService;

    @Autowired
    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<?> postComment(@RequestBody CreateCommentRequest request) {
        try {
            CommentResponse response = commentService.postComment(request);
            return ResponseEntity.status(201).body(response);
        } catch (TicketNotFoundException | UserNotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<CommentResponse>> getCommentsByTicket(@PathVariable String ticketId) {
        return ResponseEntity.ok(commentService.getCommentsByTicket(ticketId));
    }
}
