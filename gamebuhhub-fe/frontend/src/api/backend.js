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
export async function getGameVideos(gameId) {
  const response = await apiFetch(`/api/games/${gameId}/videos`);
  return response.items ?? [];
}
export async function getGameScreenshots(gameId) {
  const response = await apiFetch(`/api/games/${gameId}/screenshots`);
  return response.items ?? [];
}

function fromIGDB(game) {
  const release = game.first_release_date ? new Date(game.first_release_date * 1000) : game.releaseDate ? new Date(game.releaseDate) : null;
  return {
    id: game.id,
    title: game.name,
    genre: game.genres?.[0]?.name ?? game.genre ?? null,
    year: release && !Number.isNaN(release.valueOf()) ? release.getFullYear() : null,
    releaseDate: release && !Number.isNaN(release.valueOf())
      ? release.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
      : null,
    rating: game.rating == null ? null : Math.round(game.rating) / 10,
    ratingCount: game.ratingCount ?? game.rating_count ?? null,
    detail: game.summary || 'ยังไม่มีคำอธิบายเกม',
    poster: game.cover?.url ?? game.poster ?? null,
    screenshots: (game.screenshots || []).map(image => ({
      url: image.url?.startsWith('//') ? `https:${image.url}` : image.url,
    })).filter(image => image.url),
  };
}

export function getReviews(gameId) { return apiFetch(`/api/games/${gameId}/reviews`); }
export function postReview(gameId, text, score, token) {
  return apiFetch(`/api/games/${gameId}/reviews`, { method: 'POST', body: { text, score }, token });
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
export async function getAdminOverview(token) { return apiFetch('/api/admin/overview', { token }); }
export async function getAdminGames(token) { return (await apiFetch('/api/admin/games', { token })).items; }
export function deleteAdminGame(gameId, token) { return apiFetch(`/api/admin/games/${gameId}`, { method: 'DELETE', token }); }
export function updateAdminGame(gameId, payload, token) { return apiFetch(`/api/admin/games/${gameId}`, { method: 'PUT', body: payload, token }); }
