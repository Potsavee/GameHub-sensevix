package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"gamehub/mw"
	"gamehub/store"
)

func (h *Handler) AdminMembers(w http.ResponseWriter, r *http.Request) {
	members, err := h.Store.ListMembers(r.Context())
	if err != nil { internal(w, err); return }
	writeJSON(w, http.StatusOK, map[string]any{"items": members})
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
