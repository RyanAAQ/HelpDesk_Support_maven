package ng.helpdesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.CrossOrigin;

@SpringBootApplication
@CrossOrigin(origins = "*")
public class HelpdeskSupportApplication {
    public static void main(String[] args) {
        SpringApplication.run(HelpdeskSupportApplication.class, args);
    }
}
