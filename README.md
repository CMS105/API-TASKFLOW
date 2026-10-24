# TaskFlow (FastAPI + PostgreSQL)

Lightweight task management API backed by PostgreSQL and FastAPI, with a built-in dark mode dashboard and Swagger docs.

## Setup

1. Configure `.env` with your Postgres credentials:
```env
DB_USER=postgres
DB_PASSWORD=student123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fastapi_db
```

2. Initialize the database:
```bash
python create_database.py
```

3. Run the server:
```bash
uvicorn main:app --reload
```

## Routes & Pages

- Web UI: http://127.0.0.1:8000
- Swagger Docs: http://127.0.0.1:8000/docs
- Health Check: http://127.0.0.1:8000/api/health

### API Endpoints
- `GET /api/tasks/` - list / filter tasks (`?is_completed=`, `?priority=`, `?category=`, `?search=`)
- `POST /api/tasks/` - create task
- `GET /api/tasks/stats/summary` - stats overview
- `GET /api/tasks/{id}` - get task
- `PUT /api/tasks/{id}` - update task
- `PATCH /api/tasks/{id}/toggle` - toggle status
- `DELETE /api/tasks/{id}` - delete task

## Tests
```bash
python test_api.py
```
