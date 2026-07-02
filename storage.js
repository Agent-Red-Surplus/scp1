export const storage = {
  load(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } },
  save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
};

