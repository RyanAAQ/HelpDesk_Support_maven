package ng.helpdesk.data.repositories;

import ng.helpdesk.data.models.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CommentRepository extends MongoRepository<Comment, String> {
    List<Comment> findByTicketId(String ticketId);
<<<<<<< HEAD
    void deleteByTicketId(String ticketId);
=======
>>>>>>> f4ce8b4e73d6a19e14a22a11fbe9be3f777111de
}
