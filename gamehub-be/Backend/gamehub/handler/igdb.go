package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
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
	Franchise *struct { ID int64 `json:"id"`; Name string `json:"name"` } `json:"franchise"`
	Cover *struct { URL string `json:"url"` } `json:"cover"`
	Screenshots []struct { URL string `json:"url"` } `json:"screenshots"`
	FirstReleaseDate int64 `json:"first_release_date"`; Rating *float64 `json:"rating"`; RatingCount int `json:"rating_count"`
}

type GameScreenshot struct {
	ImageID string `json:"imageId"`
	URL     string `json:"url"`
	Width   int    `json:"width"`
	Height  int    `json:"height"`
	Source  string `json:"source,omitempty"`
}

type igdbExternalGame struct {
	UID string `json:"uid"`
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
	// IGDB's `search` clause uses its indexed full-text search. The previous
	// `where name ~ "*term*"` syntax treated the wildcard as part of a string
	// and could return no matches for ordinary searches such as Minecraft.
	baseURL := "https://api.igdb.com/v4/games"
	fields := "fields id,name,summary,genres.name,cover.url,first_release_date,rating,rating_count,franchise.id,franchise.name;"
	if strings.TrimSpace(query) != "" {
		body := fmt.Sprintf("search \"%s\"; %s limit 200;", query, fields)
		return requestIGDBGames(ctx, baseURL, clientID, token, body)
	}

	// Read batches ordered by popularity until the diverse catalog contains 200
	// released games. A single 500-result page can be dominated by one series.
	candidates := make([]Game, 0, 2000)
	for offset := 0; offset < 5000; offset += 500 {
		body := fmt.Sprintf("%s where first_release_date >= 1262304000 & rating_count > 0; sort rating_count desc; limit 500; offset %d;", fields, offset)
		batch, err := requestIGDBGames(ctx, baseURL, clientID, token, body)
		if err != nil { return nil, err }
		if len(batch) == 0 { break }
		candidates = append(candidates, batch...)
		selected := diversifyByFranchise(candidates, 200)
		if len(selected) == 200 { return selected, nil }
	}
	return diversifyByFranchise(candidates, 200), nil
}

func requestIGDBGames(ctx context.Context, endpoint, clientID, token, body string) ([]Game, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewBufferString(body))
	if err != nil { return nil, err }
	req.Header.Set("Client-ID", clientID)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "text/plain")
	resp, err := igdbHTTPClient.Do(req)
	if err != nil { return nil, err }
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK { return nil, fmt.Errorf("IGDB returned %d", resp.StatusCode) }
	var games []Game
	if err := json.NewDecoder(resp.Body).Decode(&games); err != nil { return nil, err }
	return games, nil
}

func diversifyByFranchise(games []Game, limit int) []Game {
	franchiseCounts := map[string]int{}
	seenTitles := map[string]bool{}
	selected := make([]Game, 0, limit)
	for _, game := range games {
		nameKey := normalizeGameName(game.Name)
		if nameKey == "" || seenTitles[nameKey] { continue }
		seenTitles[nameKey] = true

		// IGDB franchise IDs are the authoritative grouping. A small fallback
		// handles common series when IGDB leaves franchise empty.
		seriesKey := ""
		if game.Franchise != nil && game.Franchise.ID > 0 {
			seriesKey = fmt.Sprintf("franchise:%d", game.Franchise.ID)
		} else if game.Franchise != nil && strings.TrimSpace(game.Franchise.Name) != "" {
			seriesKey = "franchise-name:" + normalizeGameName(game.Franchise.Name)
		} else {
			seriesKey = knownSeriesKey(nameKey)
		}
		if seriesKey != "" && franchiseCounts[seriesKey] >= 2 { continue }
		if seriesKey != "" { franchiseCounts[seriesKey]++ }
		selected = append(selected, game)
		if len(selected) == limit { break }
	}
	return selected
}

func normalizeGameName(name string) string {
	return strings.Join(strings.Fields(strings.ToLower(strings.TrimSpace(name))), " ")
}

func knownSeriesKey(name string) string {
	// Keep these fallbacks specific: broad word matching can incorrectly group
	// unrelated games that happen to share a word in their titles.
	for _, series := range []string{
		"assassin's creed", "assassins creed", "grand theft auto", "the legend of zelda",
		"call of duty", "god of war", "red dead redemption", "the witcher",
		"far cry", "resident evil", "tomb raider", "dark souls", "final fantasy",
		"the elder scrolls", "fallout", "battlefield", "halo", "forza",
	} {
		if strings.HasPrefix(name, series) { return "series:" + series }
	}
	return ""
}

func (h *Handler) SearchGames(w http.ResponseWriter, r *http.Request) {
	term := strings.TrimSpace(r.URL.Query().Get("q"))

	// ถ้าส่ง q มาแต่ว่าง ให้คืนรายการว่าง ไม่ดึงเกมยอดนิยม
	if r.URL.Query().Has("q") && term == "" {
		writeJSON(w, http.StatusOK, map[string]any{"items": []Game{}})
		return
	}

	dbTerm := term
	if strings.EqualFold(term, "gta") {
		dbTerm = "Grand Theft Auto"
	}

	items, err := h.Store.ListCatalogGames(r.Context(), dbTerm, false)
	if err != nil {
		internal(w, err)
		return
	}

	// เติมแค็ตตาล็อกจาก IGDB เฉพาะครั้งแรก เมื่อยังไม่มีข้อมูลและไม่มีคำค้น
	if len(items) == 0 && term == "" {
		games, fetchErr := h.searchIGDB(r.Context(), "")
		if fetchErr != nil {
			internal(w, fetchErr)
			return
		}

		for i := range games {
			var cover *string
			if games[i].Cover != nil {
				games[i].Cover.URL = "https:" + strings.Replace(
					games[i].Cover.URL,
					"t_thumb",
					"t_cover_big",
					1,
				)
				cover = &games[i].Cover.URL
			}

			genre := ""
			if len(games[i].Genres) > 0 {
				genre = games[i].Genres[0].Name
			}

			var releaseDate *time.Time
			if games[i].FirstReleaseDate > 0 {
				date := time.Unix(games[i].FirstReleaseDate, 0).UTC()
				releaseDate = &date
			}

			if err := h.Store.SaveGame(
				r.Context(),
				games[i].ID,
				games[i].Name,
				games[i].Summary,
				genre,
				releaseDate,
				cover,
				games[i].RatingCount,
			); err != nil {
				internal(w, err)
				return
			}
		}

		items, err = h.Store.ListCatalogGames(r.Context(), dbTerm, false)
		if err != nil {
			internal(w, err)
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) GetGame(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "id"); if !ok { writeError(w, 400, "BAD_ID", "รหัสเกมไม่ถูกต้อง"); return }
	token, err := getIGDBToken(r.Context()); if err != nil { internal(w, err); return }
	query := fmt.Sprintf("fields id,name,summary,genres.name,cover.url,screenshots.url,first_release_date,rating,rating_count; where id = %d;", id)
	req, _ := http.NewRequestWithContext(r.Context(), http.MethodPost, "https://api.igdb.com/v4/games", bytes.NewBufferString(query))
	req.Header.Set("Client-ID", os.Getenv("IGDB_CLIENT_ID")); req.Header.Set("Authorization", "Bearer "+token); req.Header.Set("Content-Type", "text/plain")
	resp, err := igdbHTTPClient.Do(req); if err != nil { internal(w, err); return }; defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK { internal(w, fmt.Errorf("IGDB returned %d", resp.StatusCode)); return }
	var items []Game; if err := json.NewDecoder(resp.Body).Decode(&items); err != nil { internal(w, err); return }
	if len(items) > 0 { if items[0].Cover != nil { items[0].Cover.URL = "https:" + strings.Replace(items[0].Cover.URL, "t_thumb", "t_cover_big", 1) }; for i := range items[0].Screenshots { items[0].Screenshots[i].URL = "https:" + strings.Replace(items[0].Screenshots[i].URL, "t_thumb", "t_screenshot_huge", 1) }; var cover *string; if items[0].Cover != nil { cover = &items[0].Cover.URL }; genre := ""; if len(items[0].Genres) > 0 { genre = items[0].Genres[0].Name }; var releaseDate *time.Time; if items[0].FirstReleaseDate > 0 { date := time.Unix(items[0].FirstReleaseDate, 0).UTC(); releaseDate = &date }; if err := h.Store.SaveGame(r.Context(), items[0].ID, items[0].Name, items[0].Summary, genre, releaseDate, cover, items[0].RatingCount); err != nil { internal(w, err); return }; writeJSON(w, 200, items[0]); return }
	writeError(w, http.StatusNotFound, "GAME_NOT_FOUND", "ไม่พบเกมนี้")
}

func (h *Handler) GetGameScreenshots(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "id")
	if !ok {
		writeError(w, http.StatusBadRequest, "BAD_ID", "รหัสเกมไม่ถูกต้อง")
		return
	}
	if urls, fresh, err := h.Store.GetScreenshotCache(r.Context(), id); err == nil && fresh {
		writeJSON(w, http.StatusOK, map[string]any{"items": screenshotsFromURLs(urls, "cache")})
		return
	} else if err != nil {
		// Keep media available while an older database is waiting for migration 005.
		log.Printf("screenshot cache read failed for game %d: %v", id, err)
	}

	token, err := getIGDBToken(r.Context())
	if err != nil {
		internal(w, err)
		return
	}

	query := fmt.Sprintf("fields image_id,url,width,height; where game = %d; limit 20;", id)
	images, err := requestIGDBScreenshots(r.Context(), os.Getenv("IGDB_CLIENT_ID"), token, query)
	var igdbErr error
	if err != nil {
		igdbErr = err
		images = nil
	}
	urls := make([]string, 0, len(images))
	for _, image := range images {
		imageURL := image.URL
		if strings.HasPrefix(imageURL, "//") {
			imageURL = "https:" + imageURL
		}
		imageURL = strings.Replace(imageURL, "t_thumb", "t_screenshot_huge", 1)
		if imageURL != "" {
			urls = append(urls, imageURL)
		}
	}
	source := "IGDB"
	cacheable := igdbErr == nil
	if len(urls) == 0 {
		steamURLs, steamErr := getSteamScreenshots(r.Context(), id, os.Getenv("IGDB_CLIENT_ID"), token)
		if steamErr != nil {
			log.Printf("Steam screenshot fallback failed for game %d: %v", id, steamErr)
			cacheable = false
		} else if len(steamURLs) > 0 {
			urls = steamURLs
			source = "Steam"
			cacheable = true
		} else {
			cacheable = igdbErr == nil
		}
	}
	if len(urls) == 0 && igdbErr != nil {
		internal(w, igdbErr)
		return
	}
	if cacheable {
		if err := h.Store.SaveScreenshotCache(r.Context(), id, urls); err != nil {
			log.Printf("screenshot cache write failed for game %d: %v", id, err)
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": screenshotsFromURLs(urls, source)})
}

func screenshotsFromURLs(urls []string, source string) []GameScreenshot {
	items := make([]GameScreenshot, 0, len(urls))
	for _, imageURL := range urls {
		items = append(items, GameScreenshot{URL: imageURL, Source: source})
	}
	return items
}

// IGDB external_games category 1 identifies a Steam store app ID.
func getIGDBSteamAppIDs(ctx context.Context, gameID int64, clientID, token string) ([]string, error) {
	query := fmt.Sprintf("fields uid; where game = %d & category = 1; limit 10;", gameID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.igdb.com/v4/external_games", strings.NewReader(query))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Client-ID", clientID)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "text/plain")
	resp, err := igdbHTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("IGDB external games returned %d", resp.StatusCode)
	}
	var externalGames []igdbExternalGame
	if err := json.NewDecoder(resp.Body).Decode(&externalGames); err != nil {
		return nil, err
	}
	appIDs := make([]string, 0, len(externalGames))
	for _, externalGame := range externalGames {
		if _, err := strconv.ParseInt(externalGame.UID, 10, 64); err != nil {
			continue
		}
		appIDs = append(appIDs, externalGame.UID)
	}
	return appIDs, nil
}

type steamStoreMedia struct {
	Success bool `json:"success"`
	Data    struct {
		Screenshots []struct {
			PathFull string `json:"path_full"`
		} `json:"screenshots"`
	} `json:"data"`
}

func getSteamScreenshots(ctx context.Context, gameID int64, clientID, token string) ([]string, error) {
	appIDs, err := getIGDBSteamAppIDs(ctx, gameID, clientID, token)
	if err != nil {
		return nil, err
	}
	var lastErr error
	for _, appID := range appIDs {
		media, err := requestSteamMedia(ctx, appID)
		if err != nil {
			lastErr = err
			continue
		}
		urls := make([]string, 0, len(media.Data.Screenshots))
		for _, image := range media.Data.Screenshots {
			if image.PathFull != "" {
				urls = append(urls, image.PathFull)
			}
		}
		if media.Success && len(urls) > 0 {
			return urls, nil
		}
	}
	if lastErr != nil {
		return nil, lastErr
	}
	return []string{}, nil
}

func requestSteamMedia(ctx context.Context, appID string) (steamStoreMedia, error) {
	endpoint := "https://store.steampowered.com/api/appdetails?appids=" + url.QueryEscape(appID) + "&l=english"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return steamStoreMedia{}, err
	}
	req.Header.Set("User-Agent", "GameReview/1.0")
	resp, err := igdbHTTPClient.Do(req)
	if err != nil {
		return steamStoreMedia{}, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return steamStoreMedia{}, fmt.Errorf("Steam Store returned %d", resp.StatusCode)
	}
	var result map[string]steamStoreMedia
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return steamStoreMedia{}, err
	}
	entry, ok := result[appID]
	if !ok {
		return steamStoreMedia{}, nil
	}
	return entry, nil
}

func requestIGDBScreenshots(ctx context.Context, clientID, token, body string) ([]GameScreenshot, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.igdb.com/v4/screenshots", strings.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Client-ID", clientID)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "text/plain")

	resp, err := igdbHTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("IGDB screenshots returned %d", resp.StatusCode)
	}

	var images []GameScreenshot
	if err := json.NewDecoder(resp.Body).Decode(&images); err != nil {
		return nil, err
	}
	return images, nil
}
