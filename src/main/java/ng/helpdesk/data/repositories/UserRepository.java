package ng.helpdesk.data.repositories;

<<<<<<< HEAD
import ng.helpdesk.data.models.Role;
import ng.helpdesk.data.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
=======
import ng.helpdesk.data.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;
>>>>>>> f4ce8b4e73d6a19e14a22a11fbe9be3f777111de
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
<<<<<<< HEAD
    List<User> findByRole(Role role);
=======
>>>>>>> f4ce8b4e73d6a19e14a22a11fbe9be3f777111de
}
