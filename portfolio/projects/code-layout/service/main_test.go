package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestLayoutHandlerRejectsEmptySource(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/layout", strings.NewReader(`{"source":"   "}`))
	recorder := httptest.NewRecorder()

	layoutHandler(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
}

func TestLayoutHandlerReturnsSummary(t *testing.T) {
	request := httptest.NewRequest(http.MethodPost, "/layout", strings.NewReader(`{"source":"<?php function run(): void {}","language":"php"}`))
	recorder := httptest.NewRecorder()

	layoutHandler(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if !strings.Contains(recorder.Body.String(), `"summary"`) {
		t.Fatalf("body = %q, want summary", recorder.Body.String())
	}
}

func TestRootHandler(t *testing.T) {
	recorder := httptest.NewRecorder()
	rootHandler(recorder, httptest.NewRequest(http.MethodGet, "/", nil))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if !strings.Contains(recorder.Body.String(), `"service":"code-layout"`) {
		t.Fatalf("body = %q, want service info", recorder.Body.String())
	}
}
