package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
)

type analyzeRequest struct {
	Text string `json:"text"`
}

type errorResponse struct {
	Error string `json:"error"`
}

func main() {
	port := getenv("PORT", "8081")
	origin := getenv("CORS_ORIGIN", "http://localhost:5173")

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", healthHandler)
	mux.HandleFunc("POST /analyze", analyzeHandler)

	server := http.Server{
		Addr:    ":" + port,
		Handler: withCORS(mux, origin),
	}

	log.Printf("Text Lens service listening on http://localhost:%s", port)
	log.Fatal(server.ListenAndServe())
}

func healthHandler(writer http.ResponseWriter, _ *http.Request) {
	writeJSON(writer, http.StatusOK, map[string]string{"status": "ok"})
}

func analyzeHandler(writer http.ResponseWriter, request *http.Request) {
	var payload analyzeRequest
	decoder := json.NewDecoder(http.MaxBytesReader(writer, request.Body, 1<<20))
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&payload); err != nil {
		writeError(writer, http.StatusBadRequest, "request body must be JSON with a text field")
		return
	}

	if strings.TrimSpace(payload.Text) == "" {
		writeError(writer, http.StatusBadRequest, "text must not be empty")
		return
	}

	writeJSON(writer, http.StatusOK, AnalyzeText(payload.Text))
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
