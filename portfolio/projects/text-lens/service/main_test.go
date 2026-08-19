package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestAnalyzeHandlerRejectsEmptyText(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/analyze", strings.NewReader(`{"text":"   "}`))
	recorder := httptest.NewRecorder()

	analyzeHandler(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
}

func TestRootHandler(t *testing.T) {
	recorder := httptest.NewRecorder()
	rootHandler(recorder, httptest.NewRequest(http.MethodGet, "/", nil))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if !strings.Contains(recorder.Body.String(), `"service":"text-lens"`) {
		t.Fatalf("body = %q, want service info", recorder.Body.String())
	}
}

func TestHealthHandler(t *testing.T) {
	recorder := httptest.NewRecorder()
	healthHandler(recorder, httptest.NewRequest(http.MethodGet, "/healthz", nil))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if !strings.Contains(recorder.Body.String(), `"status":"ok"`) {
		t.Fatalf("body = %q, want ok status", recorder.Body.String())
	}
}
