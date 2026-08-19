package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
)

type layoutRequest struct {
	Source    string `json:"source"`
	Language  string `json:"language"`
	Filename  string `json:"filename"`
	MaxTokens int    `json:"maxTokens"`
}

type errorResponse struct {
	Error string `json:"error"`
}

func main() {
	port := getenv("PORT", "8082")
	origin := getenv("CORS_ORIGIN", "http://localhost:5173")

	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", rootHandler)
	mux.HandleFunc("GET /healthz", healthHandler)
	mux.HandleFunc("POST /layout", layoutHandler)

	server := http.Server{
		Addr:    ":" + port,
		Handler: withCORS(mux, origin),
	}

	log.Printf("Code Layout service listening on http://localhost:%s", port)
	log.Fatal(server.ListenAndServe())
}

func rootHandler(writer http.ResponseWriter, _ *http.Request) {
	writeJSON(writer, http.StatusOK, map[string]any{
		"service": "code-layout",
		"status":  "ok",
		"endpoints": map[string]string{
			"health": "GET /healthz",
			"layout": "POST /layout",
		},
	})
}

func healthHandler(writer http.ResponseWriter, _ *http.Request) {
	writeJSON(writer, http.StatusOK, map[string]string{"status": "ok"})
}

func layoutHandler(writer http.ResponseWriter, request *http.Request) {
	var payload layoutRequest
	decoder := json.NewDecoder(http.MaxBytesReader(writer, request.Body, 1<<20))
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&payload); err != nil {
		writeError(writer, http.StatusBadRequest, "тело запроса должно быть JSON с полем source")
		return
	}

	if strings.TrimSpace(payload.Source) == "" {
		writeError(writer, http.StatusBadRequest, "поле source не должно быть пустым")
		return
	}

	writeJSON(writer, http.StatusOK, SummarizeSource(SourceRequest{
		Source:    payload.Source,
		Language:  payload.Language,
		Filename:  payload.Filename,
		MaxTokens: payload.MaxTokens,
	}))
}

func withCORS(handler http.Handler, origin string) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Access-Control-Allow-Origin", origin)
		writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if request.Method == http.MethodOptions {
			writer.WriteHeader(http.StatusNoContent)
			return
		}
		handler.ServeHTTP(writer, request)
	})
}

func writeJSON(writer http.ResponseWriter, status int, value any) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	if err := json.NewEncoder(writer).Encode(value); err != nil {
		log.Printf("write response: %v", err)
	}
}

func writeError(writer http.ResponseWriter, status int, message string) {
	writeJSON(writer, status, errorResponse{Error: message})
}

func getenv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}
