/* ============================================================
   NutriQuest — API Helper
   Centraliza todas as chamadas ao backend (http://localhost:3001)
   ============================================================ */

const API_BASE = 'https://nutriquest-completo.onrender.com/api';
const USER_KEY  = 'nq_user';

const NQ = {
  /* ── Token ─────────────────────────────────────────────── */
  getToken() { return localStorage.getItem(TOKEN_KEY); },
  setToken(t) { localStorage.setItem(TOKEN_KEY, t); },
  removeToken() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },

  getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  },
  setUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); },

  /* ── Auth headers ───────────────────────────────────────── */
  headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const t = this.getToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  },

  /* ── Fetch wrapper ──────────────────────────────────────── */
  async req(path, opts = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: this.headers(),
      ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
    return data;
  },

  /* ── Auth ───────────────────────────────────────────────── */
  async register(username, email, password) {
    const data = await this.req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  async login(email, password) {
    const data = await this.req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  logout() {
    this.removeToken();
    window.location.href = '/login.html';
  },

  async validate() {
    try {
      const data = await this.req('/auth/validate', { method: 'POST' });
      if (data.valid) this.setUser(data.user);
      return data.valid;
    } catch { return false; }
  },

  /* ── Usuário ────────────────────────────────────────────── */
  async getMe()       { return this.req('/users/me'); },
  async updateMe(body){ return this.req('/users/me', { method: 'PUT', body: JSON.stringify(body) }); },
  async getStats()    { return this.req('/users/me/stats'); },

  /* ── Alimentos ──────────────────────────────────────────── */
  async getFoods(search = '', category = '') {
    const q = new URLSearchParams();
    if (search)   q.set('search', search);
    if (category) q.set('category', category);
    return this.req(`/foods?${q}`);
  },
  async createFood(body) { return this.req('/foods', { method: 'POST', body: JSON.stringify(body) }); },
  async updateFood(id, body) { return this.req(`/foods/${id}`, { method: 'PUT', body: JSON.stringify(body) }); },
  async deleteFood(id) { return this.req(`/foods/${id}`, { method: 'DELETE' }); },

  /* ── Lista de compras ───────────────────────────────────── */
  async getShop()          { return this.req('/shop'); },
  async addShopItem(name, qty) { return this.req('/shop', { method: 'POST', body: JSON.stringify({ name, qty }) }); },
  async toggleShopItem(id) { return this.req(`/shop/${id}/toggle`, { method: 'PATCH' }); },
  async deleteShopItem(id) { return this.req(`/shop/${id}`, { method: 'DELETE' }); },
  async clearDoneItems()   { return this.req('/shop/batch/done', { method: 'DELETE' }); },
  async clearAllItems()    { return this.req('/shop/batch/all',  { method: 'DELETE' }); },

  /* ── Utils ──────────────────────────────────────────────── */
  isLoggedIn() { return !!this.getToken(); },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },
};
