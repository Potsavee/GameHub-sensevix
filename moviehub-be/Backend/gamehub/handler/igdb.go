package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
	"unicode/utf8"
)

// IGDB credentials stay on the Go server. The browser only calls /api/games.
type igdbToken struct { AccessToken string `json:"access_token"`; ExpiresIn int `json:"expires_in"` }
type Game struct {
	ID int64 `json:"id"`; Name string `json:"name"`; Summary string `json:"summary"`
	Genres []struct { Name string `json:"name"` } `json:"genres"`
	Cover *struct { URL string `json:"url"` } `json:"cover"`
	FirstReleaseDate int64 `json:"first_release_date"`; Rating *float64 `json:"rating"`
}
var tokenMu sync.Mutex
var cachedToken string
var tokenExpiry time.Time
var igdbHTTPClient = &http.Client{Timeout: 15 * time.Second}

func getIGDBToken(ctx context.Context) (string, error) {
	tokenMu.Lock(); defer tokenMu.Unlock()
	if cachedToken != "" && time.Now().Before(tokenExpiry.Add(-time.Minute)) { return cachedToken, nil }
	clientID, secret := os.Getenv("IGDB_CLIENT_ID"), os.Getenv("IGDB_CLIENT_SECRET")
	if clientID == "" || secret == "" { return "", fmt.Errorf("IGDB credentials are not configured") }
	form := url.Values{"client_id": {clientID}, "client_secret": {secret}, "grant_type": {"client_credentials"}}
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, "https://id.twitch.tv/oauth2/token", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := igdbHTTPClient.Do(req); if err != nil { return "", err }; defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK { return "", fmt.Errorf("token service returned %d", resp.StatusCode) }
	var token igdbToken; if err := json.NewDecoder(resp.Body).Decode(&token); err != nil { return "", err }
	cachedToken, tokenExpiry = token.AccessToken, time.Now().Add(time.Duration(token.ExpiresIn)*time.Second)
	return cachedToken, nil
}

func (h *Handler) searchIGDB(ctx context.Context, query string) ([]Game, error) {
	token, err := getIGDBToken(ctx); if err != nil { return nil, err }
	clientID := os.Getenv("IGDB_CLIENT_ID")
	query = strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(query, ";", " "), "\\", " "), "\"", " ")
	if utf8.RuneCountInString(query) > 100 { query = string([]rune(query)[:100]) }
	body := fmt.Sprintf("fields id,name,summary,genres.name,cover.url,first_release_date,rating; limit 30; sort rating desc; where name ~ \"*%s*\";", query)
	if strings.TrimSpace(query) == "" { body = "fields id,name,summary,genres.name,cover.url,first_release_date,rating; limit 30; sort rating desc; where rating != null;" }
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.igdb.com/v4/games", bytes.NewBufferString(body))
	req.Header.Set("Client-ID", clientID); req.Header.Set("Authorization", "Bearer "+token); req.Header.Set("Content-Type", "text/plain")
	resp, err := igdbHTTPClient.Do(req); if err != nil { return nil, err }; defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK { return nil, fmt.Errorf("IGDB returned %d", resp.StatusCode) }
	var games []Game; err = json.NewDecoder(resp.Body).Decode(&games); return games, err
}

func (h *Handler) SearchGames(w http.ResponseWriter, r *http.Request) {
	items, err := h.searchIGDB(r.Context(), r.URL.Query().Get("q")); if err != nil { internal(w, err); return }
	for i := range items { if items[i].Cover != nil { items[i].Cover.URL = "https:" + strings.Replace(items[i].Cover.URL, "t_thumb", "t_cover_big", 1) }; var cover *string; if items[i].Cover != nil { cover = &items[i].Cover.URL }; if err := h.Store.SaveGame(r.Context(), items[i].ID, items[i].Name, items[i].Summary, cover); err != nil { internal(w, err); return } }
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) GetGame(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "id"); if !ok { writeError(w, 400, "BAD_ID", "รหัสเกมไม่ถูกต้อง"); return }
	token, err := getIGDBToken(r.Context()); if err != nil { internal(w, err); return }
	query := fmt.Sprintf("fields id,name,summary,genres.name,cover.url,first_release_date,rating; where id = %d;", id)
	req, _ := http.NewRequestWithContext(r.Context(), http.MethodPost, "https://api.igdb.com/v4/games", bytes.NewBufferString(query))
	req.Header.Set("Client-ID", os.Getenv("IGDB_CLIENT_ID")); req.Header.Set("Authorization", "Bearer "+token); req.Header.Set("Content-Type", "text/plain")
	resp, err := igdbHTTPClient.Do(req); if err != nil { internal(w, err); return }; defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK { internal(w, fmt.Errorf("IGDB returned %d", resp.StatusCode)); return }
	var items []Game; if err := json.NewDecoder(resp.Body).Decode(&items); err != nil { internal(w, err); return }
	if len(items) > 0 { if items[0].Cover != nil { items[0].Cover.URL = "https:" + strings.Replace(items[0].Cover.URL, "t_thumb", "t_cover_big", 1) }; var cover *string; if items[0].Cover != nil { cover = &items[0].Cover.URL }; if err := h.Store.SaveGame(r.Context(), items[0].ID, items[0].Name, items[0].Summary, cover); err != nil { internal(w, err); return }; writeJSON(w, 200, items[0]); return }
	writeError(w, http.StatusNotFound, "GAME_NOT_FOUND", "ไม่พบเกมนี้")
}
