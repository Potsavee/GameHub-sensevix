package store

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
)

// GetScreenshotCache returns cached image URLs and whether the cache is still fresh.
func (s *Store) GetScreenshotCache(ctx context.Context, gameID int64) ([]string, bool, error) {
	var raw []byte
	var fresh bool
	err := s.Pool.QueryRow(ctx, `
		SELECT screenshot_urls, COALESCE(screenshots_cached_at > now() - interval '30 days', false)
		FROM games WHERE id=$1`, gameID).Scan(&raw, &fresh)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, err
	}
	var urls []string
	if err := json.Unmarshal(raw, &urls); err != nil {
		return nil, false, err
	}
	return urls, fresh, nil
}

// SaveScreenshotCache persists URLs only; image bytes remain on the provider CDN.
func (s *Store) SaveScreenshotCache(ctx context.Context, gameID int64, urls []string) error {
	if urls == nil {
		urls = []string{}
	}
	raw, err := json.Marshal(urls)
	if err != nil {
		return err
	}
	_, err = s.Pool.Exec(ctx, `
		UPDATE games SET screenshot_urls=$2::jsonb, screenshots_cached_at=now()
		WHERE id=$1`, gameID, string(raw))
	return err
}
