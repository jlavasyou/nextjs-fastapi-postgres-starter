## Running the Application

Simple Catbot is a fun and interactive chat application that allows users to have multiple conversations with a cat-themed chatbot. The application is built using a modern tech stack and incorporates several design patterns for efficient and maintainable code.

## Required Software

1. Python
2. Node.js
3. Docker and Docker Compose
4. [Poetry](https://python-poetry.org/docs/#installation)
5. Postgres libpq header files (e.g. `apt install libpq-dev` on Ubuntu, `brew install postgresql` on macOS)

### First-Time Setup

1. `cd` into `backend` and run `poetry install`.
2. `cd` into `frontend` and run `npm install`.

### Running the Application

1. From the root directory, run `docker compose up`.
2. In a separate terminal, `cd` into `backend` and run `poetry run uvicorn main:app --reload`.
3. In a separate terminal, `cd` into `frontend` and run `npm run dev`.

### Curl Requests for Testing
#### Create a conversation
```bash
curl -X POST http://127.0.0.1:8000/conversations -H "Content-Type: application/json"
```
#### Get a conversation
```bash
curl -X GET http://127.0.0.1:8000/conversations/1
```

#### Get all conversations
```bash
curl -X GET http://127.0.0.1:8000/conversations
```

#### Create a message for a conversation
```bash
curl -X POST http://127.0.0.1:8000/messages \
     -H "Content-Type: application/json" \
     -d '{"content": "Hello, this is a test message", "conversation_id": 1}'
```