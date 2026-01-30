# Backend API

A minimal FastAPI app with a single POST endpoint.

## Setup

Install dependencies with Pipenv (Python 3.12):

```bash
cd backend
pipenv install
```

## Run the API

Start the server with Uvicorn inside the Pipenv shell:

```bash
pipenv run uvicorn main:app --reload
```

Or activate the shell first, then run uvicorn:

```bash
pipenv shell
uvicorn main:app --reload
```

The API will be available at **http://127.0.0.1:8000**.

- **Docs (Swagger):** http://127.0.0.1:8000/docs  
- **ReDoc:** http://127.0.0.1:8000/redoc  

## Endpoints

| Method | Path   | Description              |
|--------|--------|--------------------------|
| GET    | `/`    | Health / root message    |
| POST   | `/items` | Create an item (JSON body: `name`, optional `value`) |

### Example: POST /items

```bash
curl -X POST http://127.0.0.1:8000/items \
  -H "Content-Type: application/json" \
  -d '{"name": "My Item", "value": 42.5}'
```

Response:

```json
{"id": 1, "name": "My Item", "value": 42.5}
```
