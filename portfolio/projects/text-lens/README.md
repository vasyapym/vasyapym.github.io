# Text Lens

Text Lens is the first Luna Lab project: a small reading-insights tool with a React page and a Go analysis module.

The Go implementation owns the text rules behind `AnalyzeText`. Its HTTP handler is an adapter at the seam, so the behavior can be tested without starting a server and the transport can change without moving the analysis logic into the frontend.

## Run the service

```bash
cd portfolio/projects/text-lens/service
go test ./...
go run .
```

The service listens on `http://localhost:8081` by default. Opening that URL shows the service endpoints. The API also exposes `GET /healthz` and `POST /analyze`. Set `PORT` to change the port and `CORS_ORIGIN` to change the allowed development origin.
