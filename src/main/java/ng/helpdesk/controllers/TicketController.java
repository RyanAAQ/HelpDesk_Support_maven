package ng.helpdesk.controllers;

import ng.helpdesk.dtos.requests.AssignAgentRequest;
import ng.helpdesk.dtos.requests.CreateTicketRequest;
import ng.helpdesk.dtos.requests.UpdateTicketStatusRequest;
import ng.helpdesk.dtos.responses.TicketResponse;
import ng.helpdesk.exceptions.TicketNotFoundException;
import ng.helpdesk.exceptions.UserNotFoundException;
import ng.helpdesk.services.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/tickets")
public class TicketController {

    private TicketService ticketService;

    @Autowired
    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    public ResponseEntity<?> createTicket(@RequestBody CreateTicketRequest request) {
        try {
            TicketResponse response = ticketService.createTicket(request);
            return ResponseEntity.status(201).body(response);
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTicketById(@PathVariable String id) {
        try {
            TicketResponse response = ticketService.getTicketById(id);
            return ResponseEntity.ok(response);
        } catch (TicketNotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<TicketResponse>> getTicketsByCustomer(@PathVariable String customerId) {
        return ResponseEntity.ok(ticketService.getTicketsByCustomer(customerId));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignAgent(@PathVariable String id, @RequestBody AssignAgentRequest request) {
        try {
            TicketResponse response = ticketService.assignAgent(id, request);
            return ResponseEntity.ok(response);
        } catch (TicketNotFoundException | UserNotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody UpdateTicketStatusRequest request) {
        try {
            TicketResponse response = ticketService.updateStatus(id, request);
            return ResponseEntity.ok(response);
        } catch (TicketNotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTicket(@PathVariable String id) {
        try {
            ticketService.deleteTicket(id);
            return ResponseEntity.noContent().build();
        } catch (TicketNotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}
