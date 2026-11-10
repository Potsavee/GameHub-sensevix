package handler

import (
	"net/http"

	"gamehub/mw"
)

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	who := mw.WhoFrom(r.Context())
	member, err := h.Store.MemberByID(r.Context(), who.ID)
	if err != nil {
		internal(w, err)
		return
	}
	writeJSON(w, http.StatusOK, member)
}