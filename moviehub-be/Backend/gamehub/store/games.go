package store

import (
	"context"
	"errors"
	"time"
)

var ErrNoGame = errors.New("game not found")

type GameReview struct {
	ID        int64        `json:"id"`
	MemberID  int64        `json:"memberId"`
	GameID    int64        `json:"gameId"`
	Text      string       `json:"text"`
	CreatedAt time.Time    `json:"createdAt"`
	Member    ReviewAuthor `json:"member"`
}

type GameWishlistItem struct {
	GameID  int64     `json:"gameId"`
	Title   string    `json:"title"`
	Poster  *string   `json:"poster"`
	AddedAt time.Time `json:"addedAt"`
}

func (s *Store) SaveGame(ctx context.Context, id int64, title, summary string, poster *string) error {
	_, err := s.Pool.Exec(ctx, `
		INSERT INTO games (id, title, summary, cover_url) VALUES ($1, $2, $3, $4)
		ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary,
		cover_url=EXCLUDED.cover_url, updated_at=now()`, id, title, summary, poster)
	return err
}

func (s *Store) ListGameReviews(ctx context.Context, gameID int64) ([]GameReview, error) {
	rows, err := s.Pool.Query(ctx, `
		SELECT r.id, r.member_id, r.game_id, r.text, r.created_at, m.display_name
		FROM game_reviews r JOIN members m ON m.id=r.member_id
		WHERE r.game_id=$1 ORDER BY r.created_at DESC`, gameID)
	if err != nil { return nil, err }
	defer rows.Close()
	out := []GameReview{}
	for rows.Next() {
		var review GameReview
		if err := rows.Scan(&review.ID, &review.MemberID, &review.GameID, &review.Text,
			&review.CreatedAt, &review.Member.DisplayName); err != nil { return nil, err }
		review.Member.ID = review.MemberID
		out = append(out, review)
	}
	return out, rows.Err()
}

func (s *Store) AddGameReview(ctx context.Context, memberID, gameID int64, text string) (GameReview, error) {
	review := GameReview{MemberID: memberID, GameID: gameID, Text: text}
	err := s.Pool.QueryRow(ctx, `
		INSERT INTO game_reviews (member_id, game_id, text) VALUES ($1, $2, $3)
		RETURNING id, created_at`, memberID, gameID, text).Scan(&review.ID, &review.CreatedAt)
	return review, err
}

func (s *Store) DeleteGameReview(ctx context.Context, reviewID, memberID int64, isAdmin bool) error {
	tag, err := s.Pool.Exec(ctx, `DELETE FROM game_reviews WHERE id=$1 AND (member_id=$2 OR $3)`, reviewID, memberID, isAdmin)
	if err != nil { return err }
	if tag.RowsAffected() == 0 { return ErrNotFound }
	return nil
}

func (s *Store) ListGameWishlist(ctx context.Context, memberID int64) ([]GameWishlistItem, error) {
	rows, err := s.Pool.Query(ctx, `
		SELECT w.game_id, g.title, g.cover_url, w.added_at
		FROM game_wishlist w JOIN games g ON g.id=w.game_id
		WHERE w.member_id=$1 ORDER BY w.added_at DESC`, memberID)
	if err != nil { return nil, err }
	defer rows.Close()
	out := []GameWishlistItem{}
	for rows.Next() {
		var item GameWishlistItem
		if err := rows.Scan(&item.GameID, &item.Title, &item.Poster, &item.AddedAt); err != nil { return nil, err }
		out = append(out, item)
	}
	return out, rows.Err()
}

func (s *Store) PutGameWishlist(ctx context.Context, memberID, gameID int64) error {
	tag, err := s.Pool.Exec(ctx, `
		INSERT INTO game_wishlist (member_id, game_id)
		SELECT $1, id FROM games WHERE id=$2 ON CONFLICT DO NOTHING`, memberID, gameID)
	if err != nil { return err }
	if tag.RowsAffected() == 0 {
		var exists bool
		err = s.Pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM games WHERE id=$1)`, gameID).Scan(&exists)
		if err == nil && !exists { return ErrNoGame }
	}
	return err
}

func (s *Store) DeleteGameWishlist(ctx context.Context, memberID, gameID int64) error {
	_, err := s.Pool.Exec(ctx, `DELETE FROM game_wishlist WHERE member_id=$1 AND game_id=$2`, memberID, gameID)
	return err
}
