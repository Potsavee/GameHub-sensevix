package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"gamehub/mw"
	"gamehub/store"
)

func (h *Handler) AdminMembers(w http.ResponseWriter, r *http.Request) {
	members, err := h.Store.ListMembers(r.Context())
	if err != nil { internal(w, err); return }
	writeJSON(w, http.StatusOK, map[string]any{"items": members})
}

func (h *Handler) AdminOverview(w http.ResponseWriter, r *http.Request) {
	data, err := h.Store.GetAdminOverview(r.Context())
	if err != nil { internal(w, err); return }
	writeJSON(w, http.StatusOK, data)
}

func (h *Handler) AdminGames(w http.ResponseWriter, r *http.Request) {
	items, err := h.Store.ListAdminGames(r.Context())
	if err != nil { internal(w, err); return }
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) DeleteAdminGame(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "gameId")
	if !ok { writeError(w, http.StatusBadRequest, "BAD_ID", "รหัสเกมไม่ถูกต้อง"); return }
	err := h.Store.DeleteAdminGame(r.Context(), id)
	if errors.Is(err, store.ErrNotFound) { writeError(w, http.StatusNotFound, "GAME_NOT_FOUND", "ไม่พบเกม"); return }
	if err != nil { internal(w, err); return }
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) UpdateAdminGame(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "gameId")
	if !ok { writeError(w, http.StatusBadRequest, "BAD_ID", "รหัสเกมไม่ถูกต้อง"); return }
	var req store.AdminGame
	if json.NewDecoder(r.Body).Decode(&req) != nil { writeError(w, http.StatusBadRequest, "BAD_JSON", "อ่านกล่อง JSON ไม่ออก"); return }
	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" || len(req.Title) > 255 { writeError(w, http.StatusBadRequest, "BAD_TITLE", "ชื่อเกมต้องมี 1 ถึง 255 ตัวอักษร"); return }
	if req.Poster != nil && len(*req.Poster) > 500 { writeError(w, http.StatusBadRequest, "BAD_COVER", "URL ปกยาวเกินไป"); return }
	req.ID = id
	item, err := h.Store.UpdateAdminGame(r.Context(), req)
	if errors.Is(err, store.ErrNotFound) { writeError(w, http.StatusNotFound, "GAME_NOT_FOUND", "ไม่พบเกม"); return }
	if err != nil { internal(w, err); return }
	writeJSON(w, http.StatusOK, item)
}

func (h *Handler) SetMemberRole(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(r, "memberId")
	if !ok { writeError(w, http.StatusBadRequest, "BAD_ID", "เลขสมาชิกไม่ถูกต้อง"); return }
	if mw.WhoFrom(r.Context()).ID == id {
		writeError(w, http.StatusForbidden, "SELF_ROLE_CHANGE", "เปลี่ยนบทบาทของตัวเองไม่ได้")
		return
	}
	var req struct { Role string `json:"role"` }
	if json.NewDecoder(r.Body).Decode(&req) != nil { writeError(w, http.StatusBadRequest, "BAD_JSON", "อ่านกล่อง JSON ไม่ออก"); return }
	if req.Role != "admin" && req.Role != "member" { writeError(w, http.StatusBadRequest, "BAD_ROLE", "บทบาทไม่ถูกต้อง"); return }
	member, err := h.Store.SetMemberRole(r.Context(), id, req.Role)
	if errors.Is(err, store.ErrNotFound) { writeError(w, http.StatusNotFound, "MEMBER_NOT_FOUND", "ไม่พบสมาชิก"); return }
	if err != nil { internal(w, err); return }
	writeJSON(w, http.StatusOK, member)
}
