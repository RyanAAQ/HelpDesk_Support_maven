# HelpDesk Support System

A full-stack ticketing app where customers report problems and support staff work through them. It has a **Spring Boot + MongoDB** REST API and a lightweight **HTML / CSS / JavaScript** front end that talks to the API with `fetch`.

A customer signs up, logs in and raises a ticket (title, description, priority). A support agent can see every ticket, assign it to an agent, move it through its status, and discuss it in a comment thread with the customer. An admin can also delete tickets. What each person is allowed to do depends on their role.

## What it does

### Roles

| Role | What they can do |
|---|---|
| **Customer** | Register, log in, create tickets, see their own tickets, read and post comments |
| **Agent** | Everything a customer sees, plus view **all** tickets, assign an agent to a ticket, and update ticket status |
| **Admin** | Everything an agent can do, plus delete tickets (their comments are deleted too) |

Customers register on the normal registration page. Agents sign up on a separate agent registration page.

### Tickets

- Created by customers with a **title**, **description** and **priority** (`LOW`, `MEDIUM`, `HIGH`). Every new ticket starts as `OPEN` with no agent assigned.
- Status moves through `OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`, updated by agents or admins.
- An agent can be assigned to a ticket by another agent or an admin. The person being assigned must actually be an agent.
- Each ticket keeps its comments, so the whole conversation stays attached to the issue.

### Dashboard

After login the front end shows a dashboard with:

- A stats bar: total tickets, open tickets, high-priority tickets and resolved tickets
- **My Tickets**, **Create Ticket**, and (for agents and admins) **All Tickets** tabs
- A ticket detail window where you can read and post comments, and where agents and admins can assign an agent, change status or delete

## How it is built

The backend follows a layered structure so each part has one job:

```
src/main/java/ng/helpdesk/
├── controllers/     REST endpoints (users, tickets, comments)
├── services/        Business rules: who is allowed to do what
├── data/
│   ├── models/      User, Ticket, Comment, Role (MongoDB documents)
│   └── repositories/  Spring Data MongoDB repositories
├── dtos/            Request and response objects
├── exceptions/      Custom exceptions (UserNotFound, TicketNotFound, ...)
└── utils/           Mapper between models and response DTOs
helpdeskFrontend/    Static front end (login, register, dashboard)
```

Role checks live in the service layer, so the rules apply no matter which client calls the API. Errors come back with clear HTTP status codes: `404` when something isn't found, `403` when a role isn't allowed to do an action, `400` for bad input.

## API

Base URL: `http://localhost:8080/api`

| Method | Path | Purpose |
|---|---|---|
| POST | `/users/register` | Create a customer or agent account |
| POST | `/users/login` | Log in |
| POST | `/users/logout` | Log out |
| GET | `/users/{id}` | Get a user |
| GET | `/users/agents` | List all agents (used when assigning a ticket) |
| POST | `/tickets` | Create a ticket (customers only) |
| GET | `/tickets` | List all tickets |
| GET | `/tickets/{id}` | Get one ticket |
| GET | `/tickets/customer/{customerId}` | List one customer's tickets |
| PUT | `/tickets/{id}/assign` | Assign an agent (agents and admins) |
| PUT | `/tickets/{id}/status` | Change status (agents and admins) |
| DELETE | `/tickets/{id}?callerId=` | Delete a ticket (admins only) |
| POST | `/comments` | Post a comment on a ticket |
| GET | `/comments/ticket/{ticketId}` | List comments for a ticket |

## Run it locally

**You need:** Java and Maven, and MongoDB running on `localhost:27017`.

1. Start MongoDB.
2. Start the API from the project root:
   ```bash
   mvn spring-boot:run
   ```
   It runs on `http://localhost:8080` and uses a MongoDB database called `helpdesk`.
3. Open `helpdeskFrontend/index.html` in your browser (or serve the folder with any static server). The front end calls the API at `http://localhost:8080/api`.

## Tests

`UserServiceTest` tests the user service against an embedded MongoDB, so no database needs to be running. Run it with:

```bash
mvn test
```

## Tech stack

Java, Spring Boot, Spring Data MongoDB, MongoDB, Maven, Lombok, JUnit, HTML, CSS, JavaScript (Fetch API)

## Known limitations and next steps

- Passwords are stored as plain text and login state is a flag on the user record. Password hashing (for example BCrypt) and token-based auth (JWT) are the next security steps.
- The API trusts the caller ID sent by the client for role checks, which should be replaced by authenticated sessions or tokens.
- There is no live updating yet; the dashboard refreshes when you act or reload.
