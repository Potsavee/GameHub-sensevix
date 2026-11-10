package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"unicode/utf8"

	"gamehub/mw"
	"gamehub/store"
)

type reviewReq struct {
	Text string `json:"text"`
}

func (h *Handler) ListGameReviews(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "id")
	if !ok {
		writeError(w, http.StatusBadRequest, "BAD_ID", "รหัสเกมไม่ถูกต้อง")
		return
	}

	items, err := h.Store.ListGameReviews(r.Context(), id)
	if err != nil {
		internal(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) AddGameReview(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "id")
	if !ok {
		writeError(w, http.StatusBadRequest, "BAD_ID", "รหัสเกมไม่ถูกต้อง")
		return
	}

	var req reviewReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "BAD_JSON", "อ่านกล่อง JSON ไม่ออก")
		return
	}

	text := strings.TrimSpace(req.Text)
	if utf8.RuneCountInString(text) < 10 {
		writeError(w, http.StatusBadRequest, "REVIEW_TOO_SHORT", "รีวิวสั้นเกินไป")
		return
	}

	who := mw.WhoFrom(r.Context())
	review, err := h.Store.AddGameReview(r.Context(), who.ID, id, text)
	if err != nil {
		var pgErr interface{ SQLState() string }
		if errors.As(err, &pgErr) && pgErr.SQLState() == "23503" {
			writeError(w, http.StatusNotFound, "GAME_NOT_FOUND", "ไม่พบเกมนี้")
			return
		}
		if errors.As(err, &pgErr) && pgErr.SQLState() == "23505" {
			writeError(w, http.StatusConflict, "ALREADY_REVIEWED", "คุณรีวิวเกมนี้ไปแล้ว")
			return
		}
		internal(w, err)
		return
	}

	review.Member = store.ReviewAuthor{ID: who.ID}
	writeJSON(w, http.StatusCreated, review)
}

func (h *Handler) DeleteGameReview(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "reviewId")
	if !ok {
		writeError(w, http.StatusBadRequest, "BAD_ID", "เลขรีวิวไม่ถูกต้อง")
		return
	}

	who := mw.WhoFrom(r.Context())
	err := h.Store.DeleteGameReview(r.Context(), id, who.ID, who.Role == "admin")
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "REVIEW_NOT_FOUND", "ไม่พบรีวิวนี้ หรือไม่มีสิทธิ์ลบ")
		return
	}
	if err != nil {
		internal(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ListGameWishlist(w http.ResponseWriter, r *http.Request) {
	who := mw.WhoFrom(r.Context())
	items, err := h.Store.ListGameWishlist(r.Context(), who.ID)
	if err != nil {
		internal(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) PutGameWishlist(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "gameId")
	if !ok {
		writeError(w, http.StatusBadRequest, "BAD_ID", "รหัสเกมไม่ถูกต้อง")
		return
	}

	who := mw.WhoFrom(r.Context())
	if err := h.Store.PutGameWishlist(r.Context(), who.ID, id); err != nil {
		if errors.Is(err, store.ErrNoGame) {
			writeError(w, http.StatusNotFound, "GAME_NOT_FOUND", "ไม่พบเกมนี้")
			return
		}
		internal(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteGameWishlist(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "gameId")
	if !ok {
		writeError(w, http.StatusBadRequest, "BAD_ID", "รหัสเกมไม่ถูกต้อง")
		return
	}

	who := mw.WhoFrom(r.Context())
	if err := h.Store.DeleteGameWishlist(r.Context(), who.ID, id); err != nil {
		internal(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
