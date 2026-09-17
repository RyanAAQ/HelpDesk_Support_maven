package ng.helpdesk.services;

import lombok.AllArgsConstructor;
import ng.helpdesk.data.models.Role;
import ng.helpdesk.data.models.Ticket;
import ng.helpdesk.data.models.User;
import ng.helpdesk.data.repositories.CommentRepository;
import ng.helpdesk.data.repositories.TicketRepository;
import ng.helpdesk.data.repositories.UserRepository;
import ng.helpdesk.dtos.requests.AssignAgentRequest;
import ng.helpdesk.dtos.requests.CreateTicketRequest;
import ng.helpdesk.dtos.requests.UpdateTicketStatusRequest;
import ng.helpdesk.dtos.responses.TicketResponse;
import ng.helpdesk.exceptions.TicketNotFoundException;
import ng.helpdesk.exceptions.UserNotFoundException;
import ng.helpdesk.utils.Mapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class TicketService {

    private TicketRepository ticketRepository;
    private UserRepository userRepository;
    private CommentRepository commentRepository;

    public TicketResponse createTicket(CreateTicketRequest request) {
        Optional<User> customer = userRepository.findById(request.getCustomerId());
        if (customer.isEmpty()) {
            throw new UserNotFoundException("Customer not found");
        }
        if (customer.get().getRole() != Role.CUSTOMER) {
            throw new IllegalArgumentException("User is not a customer");
        }

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setPriority(request.getPriority());
        ticket.setCustomerId(request.getCustomerId());
        ticket.setStatus("OPEN");
        ticket.setAgentId(null);
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setComments(new ArrayList<>());
        ticketRepository.save(ticket);

        return Mapper.mapToTicket(ticket);
    }

    public List<TicketResponse> getAllTickets() {
        List<Ticket> tickets = ticketRepository.findAll();
        List<TicketResponse> result = new ArrayList<>();
        for (Ticket ticket : tickets) {
            result.add(Mapper.mapToTicket(ticket));
        }
        return result;
    }

    public TicketResponse getTicketById(String id) {
        Optional<Ticket> found = ticketRepository.findById(id);
        if (found.isEmpty()) {
            throw new TicketNotFoundException("Ticket not found");
        }
        return Mapper.mapToTicket(found.get());
    }

    public List<TicketResponse> getTicketsByCustomer(String customerId) {
        List<Ticket> tickets = ticketRepository.findByCustomerId(customerId);
        List<TicketResponse> result = new ArrayList<>();
        for (Ticket ticket : tickets) {
            result.add(Mapper.mapToTicket(ticket));
        }
        return result;
    }

    public TicketResponse assignAgent(String ticketId, AssignAgentRequest request) {
        Optional<Ticket> found = ticketRepository.findById(ticketId);
        if (found.isEmpty()) {
            throw new TicketNotFoundException("Ticket not found");
        }

        // Verify the caller is an AGENT or ADMIN
        Optional<User> caller = userRepository.findById(request.getCallerId());
        if (caller.isEmpty()) {
            throw new UserNotFoundException("Caller not found");
        }
        if (caller.get().getRole() != Role.AGENT && caller.get().getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Only agents or admins can assign agents to tickets");
        }

        Optional<User> agent = userRepository.findById(request.getAgentId());
        if (agent.isEmpty()) {
            throw new UserNotFoundException("Agent not found");
        }
        if (agent.get().getRole() != Role.AGENT) {
            throw new IllegalArgumentException("User is not an agent");
        }

        Ticket ticket = found.get();
        ticket.setAgentId(request.getAgentId());
        ticketRepository.save(ticket);

        return Mapper.mapToTicket(ticket);
    }

    public TicketResponse updateStatus(String ticketId, UpdateTicketStatusRequest request) {
        Optional<Ticket> found = ticketRepository.findById(ticketId);
        if (found.isEmpty()) {
            throw new TicketNotFoundException("Ticket not found");
        }

        // Verify the caller is an AGENT or ADMIN
        Optional<User> caller = userRepository.findById(request.getCallerId());
        if (caller.isEmpty()) {
            throw new UserNotFoundException("Caller not found");
        }
        if (caller.get().getRole() != Role.AGENT && caller.get().getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Only agents or admins can update ticket status");
        }

        Ticket ticket = found.get();
        ticket.setStatus(request.getStatus());
        ticketRepository.save(ticket);

        return Mapper.mapToTicket(ticket);
    }

    public void deleteTicket(String id, String callerId) {
        Optional<Ticket> found = ticketRepository.findById(id);
        if (found.isEmpty()) {
            throw new TicketNotFoundException("Ticket not found");
        }

        // Only ADMIN can delete tickets
        Optional<User> caller = userRepository.findById(callerId);
        if (caller.isEmpty()) {
            throw new UserNotFoundException("Caller not found");
        }
        if (caller.get().getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Only admins can delete tickets");
        }

        // Delete all comments belonging to this ticket to avoid orphaned records
        commentRepository.deleteByTicketId(id);
        ticketRepository.deleteById(id);
    }
}
