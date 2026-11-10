package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"gamehub/auth"
	"gamehub/handler"
	"gamehub/mw"
	"gamehub/store"
)

func main() {
	secret := os.Getenv("JWT_SECRET")
	if len(secret) < 32 {
		log.Fatal("JWT_SECRET ต้องยาวอย่างน้อย 32 ตัวอักษร")
	}
	pool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()
	if err := pool.Ping(context.Background()); err != nil {
		log.Fatal("ต่อฐานข้อมูลไม่ติด ", err)
	}

	tickets := &auth.Issuer{Secret: []byte(secret), TTL: time.Hour}
	login := func(f http.HandlerFunc) http.HandlerFunc { return mw.RequireLogin(tickets, f) }
	h := &handler.Handler{Store: &store.Store{Pool: pool}, Tickets: tickets}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) })
	mux.HandleFunc("POST /api/auth/register", h.Register)
	mux.HandleFunc("POST /api/auth/login", h.Login)
	mux.HandleFunc("GET /api/games", h.SearchGames)
	mux.HandleFunc("GET /api/games/{id}", h.GetGame)
	mux.HandleFunc("GET /api/games/{id}/reviews", h.ListGameReviews)

	mux.HandleFunc("GET /api/me", login(h.Me))
	mux.HandleFunc("PUT /api/me/password", login(h.ChangePassword))
	mux.HandleFunc("POST /api/games/{id}/reviews", login(h.AddGameReview))
	mux.HandleFunc("DELETE /api/game-reviews/{reviewId}", login(h.DeleteGameReview))
	mux.HandleFunc("GET /api/admin/members", login(mw.RequireRole("admin", h.AdminMembers)))
	mux.HandleFunc("PUT /api/admin/members/{memberId}/role", login(mw.RequireRole("admin", h.SetMemberRole)))
	mux.HandleFunc("GET /api/admin/overview", login(mw.RequireRole("admin", h.AdminOverview)))
	mux.HandleFunc("GET /api/admin/games", login(mw.RequireRole("admin", h.AdminGames)))
	mux.HandleFunc("PUT /api/admin/games/{gameId}", login(mw.RequireRole("admin", h.UpdateAdminGame)))
	mux.HandleFunc("DELETE /api/admin/games/{gameId}", login(mw.RequireRole("admin", h.DeleteAdminGame)))
	mux.HandleFunc("GET /api/me/game-wishlist", login(h.ListGameWishlist))
	mux.HandleFunc("PUT /api/me/game-wishlist/{gameId}", login(h.PutGameWishlist))
	mux.HandleFunc("DELETE /api/me/game-wishlist/{gameId}", login(h.DeleteGameWishlist))

	origins := strings.Split(os.Getenv("ALLOWED_ORIGINS"), ",")
	port := os.Getenv("PORT")
	if _, err := strconv.Atoi(port); err != nil { port = "8080" }
	log.Printf("GameReview API listening on :%s; allowed origins: %v", port, origins)
	log.Fatal(http.ListenAndServe(":"+port, mw.Logging(mw.CORS(origins, mux))))
}
