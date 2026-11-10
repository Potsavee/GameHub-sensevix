// All browser requests go through the Go API. IGDB credentials stay server-side.
const BASE = process.env.REACT_APP_API_URL || '';

export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({ error: 'server ไม่ได้ตอบเป็น JSON' }));
  if (!response.ok) {
    const error = new Error(data.error?.message ?? data.error ?? `server ตอบกลับ ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export function register(email, password, displayName) {
  return apiFetch('/api/auth/register', { method: 'POST', body: { email, password, displayName } });
}
export function login(email, password) {
  return apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
}
export function getMe(token) { return apiFetch('/api/me', { token }); }
export function changePassword(currentPassword, newPassword, token) {
  return apiFetch('/api/me/password', { method: 'PUT', body: { currentPassword, newPassword }, token });
}

export async function getGames(query = '') {
  const path = `/api/games${query ? `?q=${encodeURIComponent(query)}` : ''}`;
  const response = await apiFetch(path);
  return response.items.map(fromIGDB);
}
export async function getGame(gameId) {
  return fromIGDB(await apiFetch(`/api/games/${gameId}`));
}

function fromIGDB(game) {
  return {
    id: game.id,
    title: game.name,
    genre: game.genres?.[0]?.name ?? null,
    year: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : null,
    rating: game.rating == null ? null : Math.round(game.rating / 10) / 10,
    detail: game.summary || 'ยังไม่มีคำอธิบายเกม',
    poster: game.cover?.url ?? null,
  };
}

export function getReviews(gameId) { return apiFetch(`/api/games/${gameId}/reviews`); }
export function postReview(gameId, text, token) {
  return apiFetch(`/api/games/${gameId}/reviews`, { method: 'POST', body: { text }, token });
}
export function deleteGameReview(reviewId, token) {
  return apiFetch(`/api/game-reviews/${reviewId}`, { method: 'DELETE', token });
}

export function getGameWishlist(token) { return apiFetch('/api/me/game-wishlist', { token }); }
export function addGameToWishlist(gameId, token) {
  return apiFetch(`/api/me/game-wishlist/${gameId}`, { method: 'PUT', token });
}
export function removeGameFromWishlist(gameId, token) {
  return apiFetch(`/api/me/game-wishlist/${gameId}`, { method: 'DELETE', token });
}

export async function getAdminMembers(token) {
  const response = await apiFetch('/api/admin/members', { token });
  return response.items;
}
export function setMemberRole(memberId, role, token) {
  return apiFetch(`/api/admin/members/${memberId}/role`, { method: 'PUT', body: { role }, token });
}
