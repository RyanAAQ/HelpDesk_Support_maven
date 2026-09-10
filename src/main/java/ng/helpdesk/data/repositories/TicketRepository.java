package ng.helpdesk.data.repositories;

import ng.helpdesk.data.models.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TicketRepository extends MongoRepository<Ticket, String> {
    List<Ticket> findByCustomerId(String customerId);
}
