package store

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
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

type AdminGame struct {
	ID int64 `json:"id"`
	Title string `json:"title"`
	TitleTH string `json:"titleTh"`
	OriginalTitle string `json:"originalTitle"`
	OriginalLanguage string `json:"originalLanguage"`
	Genre string `json:"genre"`
	ReleaseDate *time.Time `json:"releaseDate"`
	Summary string `json:"summary"`
	SummaryTH string `json:"summaryTh"`
	SummaryEN string `json:"summaryEn"`
	Poster *string `json:"poster"`
	ReviewCount int `json:"reviewCount"`
}

type CatalogGame struct {
	ID int64 `json:"id"`
	Title string `json:"name"`
	Summary string `json:"summary"`
	Poster *string `json:"poster"`
	Genre string `json:"genre"`
	ReleaseDate *time.Time `json:"releaseDate"`
	RatingCount int `json:"ratingCount"`
}

func (s *Store) ListCatalogGames(ctx context.Context, search string, includeHidden bool) ([]CatalogGame, error) {
	rows, err := s.Pool.Query(ctx, `SELECT id, title, summary, cover_url, genre, release_date, igdb_rating_count FROM games
		WHERE ($1 OR is_hidden = false) AND ($2 = '' OR title ILIKE '%' || $2 || '%' OR title_th ILIKE '%' || $2 || '%' OR original_title ILIKE '%' || $2 || '%')
		ORDER BY igdb_rating_count DESC, title LIMIT 2000`, includeHidden, search)
	if err != nil { return nil, err }
	defer rows.Close()
	items := []CatalogGame{}
	for rows.Next() { var item CatalogGame; if err := rows.Scan(&item.ID, &item.Title, &item.Summary, &item.Poster, &item.Genre, &item.ReleaseDate, &item.RatingCount); err != nil { return nil, err }; items = append(items, item) }
	return items, rows.Err()
}

type AdminOverview struct {
	Members int `json:"members"`
	Admins int `json:"admins"`
	Games int `json:"games"`
	Reviews int `json:"reviews"`
	Wishlists int `json:"wishlists"`
	TopReviewed []AdminGame `json:"topReviewed"`
	RecentMembers []Member `json:"recentMembers"`
}

func (s *Store) GetAdminOverview(ctx context.Context) (AdminOverview, error) {
	var out AdminOverview
	err := s.Pool.QueryRow(ctx, `SELECT
		(SELECT count(*) FROM members), (SELECT count(*) FROM members WHERE role='admin'), (SELECT count(*) FROM games WHERE is_hidden=false),
		(SELECT count(*) FROM game_reviews), (SELECT count(*) FROM game_wishlist)`).
		Scan(&out.Members, &out.Admins, &out.Games, &out.Reviews, &out.Wishlists)
	if err != nil { return out, err }
	rows, err := s.Pool.Query(ctx, `SELECT g.id, g.title, g.title_th, g.original_title, g.original_language, g.genre, g.release_date, g.summary, g.summary_th, g.summary_en, g.cover_url, count(r.id)
		FROM games g JOIN game_reviews r ON r.game_id=g.id GROUP BY g.id ORDER BY count(r.id) DESC, g.title LIMIT 5`)
	if err != nil { return out, err }
	defer rows.Close()
	out.TopReviewed = []AdminGame{}
	for rows.Next() { var game AdminGame; if err := rows.Scan(&game.ID, &game.Title, &game.TitleTH, &game.OriginalTitle, &game.OriginalLanguage, &game.Genre, &game.ReleaseDate, &game.Summary, &game.SummaryTH, &game.SummaryEN, &game.Poster, &game.ReviewCount); err != nil { return out, err }; out.TopReviewed = append(out.TopReviewed, game) }
	if err := rows.Err(); err != nil { return out, err }
	rows.Close()
	memberRows, err := s.Pool.Query(ctx, `SELECT id, email, display_name, role, created_at FROM members ORDER BY created_at DESC LIMIT 5`)
	if err != nil { return out, err }
	defer memberRows.Close()
	out.RecentMembers = []Member{}
	for memberRows.Next() { var member Member; if err := memberRows.Scan(&member.ID, &member.Email, &member.DisplayName, &member.Role, &member.CreatedAt); err != nil { return out, err }; out.RecentMembers = append(out.RecentMembers, member) }
	err = memberRows.Err()
	return out, err
}

func (s *Store) ListAdminGames(ctx context.Context) ([]AdminGame, error) {
	rows, err := s.Pool.Query(ctx, `SELECT g.id, g.title, g.title_th, g.original_title, g.original_language, g.genre, g.release_date, g.summary, g.summary_th, g.summary_en, g.cover_url, count(r.id)
		FROM games g LEFT JOIN game_reviews r ON r.game_id=g.id
		WHERE g.is_hidden=false GROUP BY g.id ORDER BY g.igdb_rating_count DESC, g.title`)
	if err != nil { return nil, err }
	defer rows.Close()
	out := []AdminGame{}
	for rows.Next() { var item AdminGame; if err := rows.Scan(&item.ID, &item.Title, &item.TitleTH, &item.OriginalTitle, &item.OriginalLanguage, &item.Genre, &item.ReleaseDate, &item.Summary, &item.SummaryTH, &item.SummaryEN, &item.Poster, &item.ReviewCount); err != nil { return nil, err }; out = append(out, item) }
	return out, rows.Err()
}

func (s *Store) ListAdminGamesByIDs(ctx context.Context, ids []int64) ([]AdminGame, error) {
	if len(ids) == 0 { return []AdminGame{}, nil }
	rows, err := s.Pool.Query(ctx, `SELECT g.id, g.title, g.title_th, g.original_title, g.original_language, g.genre, g.release_date, g.summary, g.summary_th, g.summary_en, g.cover_url, count(r.id)
		FROM games g LEFT JOIN game_reviews r ON r.game_id=g.id
		WHERE g.id = ANY($1) GROUP BY g.id ORDER BY array_position($1::bigint[], g.id)`, ids)
	if err != nil { return nil, err }
	defer rows.Close()
	out := []AdminGame{}
	for rows.Next() { var item AdminGame; if err := rows.Scan(&item.ID, &item.Title, &item.TitleTH, &item.OriginalTitle, &item.OriginalLanguage, &item.Genre, &item.ReleaseDate, &item.Summary, &item.SummaryTH, &item.SummaryEN, &item.Poster, &item.ReviewCount); err != nil { return nil, err }; out = append(out, item) }
	return out, rows.Err()
}

func (s *Store) DeleteAdminGame(ctx context.Context, id int64) error {
	tag, err := s.Pool.Exec(ctx, `DELETE FROM games WHERE id=$1`, id)
	if err != nil { return err }; if tag.RowsAffected() == 0 { return ErrNotFound }; return nil
}

func (s *Store) UpdateAdminGame(ctx context.Context, item AdminGame) (AdminGame, error) {
	err := s.Pool.QueryRow(ctx, `UPDATE games SET title=$2, title_th=$3, original_title=$4, original_language=$5, genre=$6, release_date=$7, summary=$8, summary_th=$9, summary_en=$10, cover_url=$11, updated_at=now() WHERE id=$1 RETURNING id, title, title_th, original_title, original_language, genre, release_date, summary, summary_th, summary_en, cover_url`, item.ID, item.Title, item.TitleTH, item.OriginalTitle, item.OriginalLanguage, item.Genre, item.ReleaseDate, item.Summary, item.SummaryTH, item.SummaryEN, item.Poster).Scan(&item.ID, &item.Title, &item.TitleTH, &item.OriginalTitle, &item.OriginalLanguage, &item.Genre, &item.ReleaseDate, &item.Summary, &item.SummaryTH, &item.SummaryEN, &item.Poster)
	if errors.Is(err, pgx.ErrNoRows) { return AdminGame{}, ErrNotFound }
	if err != nil { return AdminGame{}, err }
	err = s.Pool.QueryRow(ctx, `SELECT count(*) FROM game_reviews WHERE game_id=$1`, item.ID).Scan(&item.ReviewCount)
	return item, err
}

func (s *Store) SaveGame(ctx context.Context, id int64, title, summary, genre string, releaseDate *time.Time, poster *string, ratingCount int) error {
	_, err := s.Pool.Exec(ctx, `
		INSERT INTO games (id, title, summary, genre, release_date, cover_url, igdb_rating_count) VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO UPDATE SET genre=CASE WHEN games.genre='' THEN EXCLUDED.genre ELSE games.genre END,
			release_date=COALESCE(games.release_date, EXCLUDED.release_date),
			cover_url=COALESCE(games.cover_url, EXCLUDED.cover_url),
			igdb_rating_count=GREATEST(games.igdb_rating_count, EXCLUDED.igdb_rating_count)`, id, title, summary, genre, releaseDate, poster, ratingCount)
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
