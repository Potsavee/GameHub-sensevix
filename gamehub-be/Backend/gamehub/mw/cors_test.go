package mw

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORSPreflightForAllowedOrigin(t *testing.T) {
	nextCalled := false
	handler := CORS([]string{" http://localhost:3000 "}, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		nextCalled = true
	}))
	req := httptest.NewRequest(http.MethodOptions, "/api/me", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusNoContent)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:3000" {
		t.Fatalf("Access-Control-Allow-Origin = %q", got)
	}
	if got := rec.Header().Get("Access-Control-Allow-Headers"); got != "Authorization, Content-Type" {
		t.Fatalf("Access-Control-Allow-Headers = %q", got)
	}
	if got := rec.Header().Get("Vary"); got != "Origin" {
		t.Fatalf("Vary = %q, want Origin", got)
	}
	if nextCalled {
		t.Fatal("preflight request reached the next handler")
	}
}

func TestCORSDoesNotAllowUnknownOrigin(t *testing.T) {
	handler := CORS([]string{"http://localhost:3000"}, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	req := httptest.NewRequest(http.MethodOptions, "/api/me", nil)
	req.Header.Set("Origin", "http://localhost:3001")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusNoContent)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("unexpected Access-Control-Allow-Origin: %q", got)
	}
}
