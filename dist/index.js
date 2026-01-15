function j(r) {
  if (r.name === void 0)
    throw new TypeError("Theme name is required");
  if (r.name === null)
    throw new TypeError("Theme name cannot be null");
  const t = r.name.trim();
  if (t === "")
    throw new TypeError("Theme name cannot be empty or whitespace-only");
  if (r.tokens === void 0)
    throw new TypeError("Theme tokens are required");
  if (r.tokens === null)
    throw new TypeError("Theme tokens cannot be null");
  if (typeof r.tokens != "object" || Array.isArray(r.tokens))
    throw new TypeError("Theme tokens must be an object");
  const i = Object.keys(r.tokens);
  if (i.length === 0)
    throw new TypeError("Theme tokens cannot be empty");
  for (const f of i) {
    if (f === "")
      throw new TypeError("Token name cannot be an empty string");
    if (f === "__proto__")
      throw new TypeError('Token name cannot be "__proto__" (prototype pollution risk)');
    if (f.includes(" "))
      throw new TypeError(`Token name cannot contain spaces: "${f}"`);
    if (f.includes("-"))
      throw new TypeError(`Token name cannot contain hyphens: "${f}"`);
    if (/^\d/.test(f))
      throw new TypeError(`Token name cannot start with a number: "${f}"`);
  }
  const l = {
    name: t,
    tokens: Object.freeze({ ...r.tokens })
  };
  return Object.freeze(l);
}
function k(r) {
  return r.replace(/[A-Z]/g, (t, i) => (i > 0 ? "-" : "") + t.toLowerCase());
}
function d(r) {
  return {
    name: r.name,
    tokens: { ...r.tokens }
  };
}
function E(r) {
  if (r == null || typeof r != "object")
    throw new TypeError("Theme must be a valid object");
  const t = r;
  if (typeof t.name != "string" || t.name === "")
    throw new TypeError("Theme must have a non-empty name property");
  if (t.tokens === null || t.tokens === void 0 || typeof t.tokens != "object" || Array.isArray(t.tokens))
    throw new TypeError("Theme must have a tokens property");
  const i = t.tokens;
  if (Object.keys(i).length === 0)
    throw new TypeError("Cannot create theme: tokens object cannot be empty");
}
function M(r) {
  if (r == null || typeof r != "object")
    throw new TypeError("Options object is required");
  if (!Array.isArray(r.themes))
    throw new TypeError("themes must be an array");
  if (r.themes.length === 0)
    throw new TypeError("themes array cannot be empty");
  for (const e of r.themes)
    E(e);
  const t = /* @__PURE__ */ new Set();
  for (const e of r.themes) {
    if (t.has(e.name))
      throw new Error(`Cannot create theme manager: duplicate theme name '${e.name}'`);
    t.add(e.name);
  }
  if (r.storageKey !== void 0 && r.storageKey === "")
    throw new TypeError("storageKey cannot be an empty string");
  const i = r.prefix ?? "--color-", l = r.target !== void 0 ? r.target : typeof document < "u" ? document.documentElement : null, f = r.defaultTheme ?? r.themes[0].name, b = r.themes.find((e) => e.name === f);
  if (!b)
    throw new Error(`Cannot create theme manager: defaultTheme '${f}' not found in themes`);
  const o = new Map(r.themes.map((e) => [e.name, e]));
  let a = b, w = [];
  const y = /* @__PURE__ */ new Set(), p = /* @__PURE__ */ new Set();
  let s = !1;
  function g(e) {
    if (l !== null) {
      for (const n of w)
        l.style.removeProperty(n);
      w = [];
      for (const [n, u] of Object.entries(e.tokens)) {
        const c = k(n), h = i.startsWith("--") ? `${i}${c}` : `--${i}${c}`;
        l.style.setProperty(h, u), w.push(h);
      }
    }
  }
  function v() {
    if (r.storageKey)
      try {
        if (typeof localStorage > "u") return;
        const e = localStorage.getItem(r.storageKey);
        if (!e || e === "") return;
        o.has(e) && (a = o.get(e), g(a));
      } catch (e) {
        typeof console < "u" && console.warn && console.warn("Failed to restore theme from localStorage:", e);
      }
  }
  function C(e) {
    if (r.storageKey)
      try {
        if (typeof localStorage > "u") return;
        localStorage.setItem(r.storageKey, e);
      } catch (n) {
        typeof console < "u" && console.warn && console.warn("Failed to save theme to localStorage:", n);
      }
  }
  g(a), v();
  const m = {
    apply(e) {
      if (s)
        throw new Error("ThemeManager has been disposed");
      if (e == null || typeof e != "string" || e === "")
        throw new Error("Theme name must be a non-empty string");
      const n = o.get(e);
      if (!n)
        throw new Error(`Cannot apply theme: '${e}' not found`);
      const u = a, c = a.name === e;
      if (c || (a = n, g(a)), C(e), !c) {
        const h = d(a), T = d(u);
        for (const S of y)
          try {
            S(h, T);
          } catch ($) {
            typeof console < "u" && console.error && console.error("Error in onChange callback:", $);
          }
      }
      return d(a);
    },
    current() {
      if (!s)
        return d(a);
    },
    currentName() {
      return s ? "" : a.name;
    },
    list() {
      return s ? [] : Array.from(o.keys());
    },
    get(e) {
      if (s)
        return;
      const n = o.get(e);
      return n ? d(n) : void 0;
    },
    has(e) {
      return s || e == null || typeof e != "string" || e === "" ? !1 : o.has(e);
    },
    register(e) {
      if (s)
        throw new Error("ThemeManager has been disposed");
      if (E(e), o.has(e.name))
        throw new Error(`Cannot register theme: '${e.name}' already exists`);
      o.set(e.name, e);
    },
    unregister(e) {
      if (s)
        throw new Error("ThemeManager has been disposed");
      const n = o.get(e);
      if (!n)
        throw new Error(`Cannot unregister theme: '${e}' not found`);
      if (a.name === e)
        throw new Error(`Cannot unregister theme: '${e}' is currently active`);
      if (o.size === 1)
        throw new Error(`Cannot unregister theme: '${e}' is the only theme`);
      return o.delete(e), d(n);
    },
    onChange(e) {
      return s ? () => {
      } : (y.add(e), () => {
        y.delete(e);
      });
    },
    clearStorage() {
      if (r.storageKey)
        try {
          if (typeof localStorage > "u") return;
          localStorage.removeItem(r.storageKey);
        } catch {
        }
    },
    prefersDark() {
      return typeof window > "u" || !window.matchMedia ? !1 : window.matchMedia("(prefers-color-scheme: dark)").matches;
    },
    prefersLight() {
      return typeof window > "u" || !window.matchMedia ? !1 : window.matchMedia("(prefers-color-scheme: light)").matches;
    },
    onSystemChange(e) {
      if (typeof window > "u" || !window.matchMedia)
        return () => {
        };
      p.add(e);
      const n = window.matchMedia("(prefers-color-scheme: dark)"), u = window.matchMedia("(prefers-color-scheme: light)"), c = (h) => {
        if (h.matches) {
          const T = h.media.includes("dark") ? "dark" : "light";
          e(T);
        }
      };
      return n.addEventListener("change", c), u.addEventListener("change", c), () => {
        p.delete(e), n.removeEventListener("change", c), u.removeEventListener("change", c);
      };
    },
    applySystem(e, n) {
      if (s)
        throw new Error("ThemeManager has been disposed");
      if (!o.has(e))
        throw new Error(`Cannot apply system theme: '${e}' not found`);
      if (!o.has(n))
        throw new Error(`Cannot apply system theme: '${n}' not found`);
      const c = m.prefersDark() ? n : e;
      return m.apply(c);
    },
    watchSystem(e, n) {
      if (s)
        throw new Error("ThemeManager has been disposed");
      if (!o.has(e))
        throw new Error(`Cannot watch system theme: '${e}' not found`);
      if (!o.has(n))
        throw new Error(`Cannot watch system theme: '${n}' not found`);
      return m.applySystem(e, n), m.onSystemChange((c) => {
        const h = c === "dark" ? n : e;
        m.apply(h);
      });
    },
    getToken(e) {
      if (!s && !(e === "__proto__" || !Object.hasOwn(a.tokens, e)))
        return a.tokens[e];
    },
    getAllTokens() {
      return s ? {} : { ...a.tokens };
    },
    getCSSVariableName(e) {
      const n = k(e);
      return i.startsWith("--") ? `${i}${n}` : `--${i}${n}`;
    },
    dispose() {
      if (!s) {
        if (s = !0, l !== null)
          for (const e of w)
            l.style.removeProperty(e);
        y.clear(), p.clear(), o.clear(), w = [];
      }
    }
  };
  return m;
}
class _ extends Error {
  constructor(t) {
    super(t), this.name = "ThemeError";
  }
}
export {
  _ as ThemeError,
  j as createTheme,
  M as createThemeManager
};
