// RootDB theme vault — 30 OS/app parody themes (SPEC §5).
// Applied as CSS custom properties on <html data-theme>. Anon users get
// Catppuccin Mocha (dark) / Catppuccin Latte (light); signed-in users pick from
// the full vault, persisted to profiles.theme and a cookie so SSR can match.

export interface ThemeDef {
  id: string;
  label: string;
  mode: "dark" | "light";
  family: string;
  vars: {
    bg: string; bgAlt: string; panel: string; text: string; muted: string;
    accent: string; onAccent: string; border: string; code: string;
  };
}

function t(id: string, label: string, mode: "dark" | "light", family: string,
  bg: string, bgAlt: string, panel: string, text: string, muted: string,
  accent: string, onAccent: string, border: string, code: string): ThemeDef {
  return { id, label, mode, family, vars: { bg, bgAlt, panel, text, muted, accent, onAccent, border, code } };
}

export const THEMES: ThemeDef[] = [
  // Catppuccin ×4
  t("catppuccin-mocha", "Catppuccin Mocha", "dark", "Catppuccin", "#1e1e2e", "#181825", "#313244", "#cdd6f4", "#a6adc8", "#cba6f7", "#11111b", "#45475a", "#f38ba8"),
  t("catppuccin-macchiato", "Catppuccin Macchiato", "dark", "Catppuccin", "#24273a", "#1e2030", "#363a4f", "#cad3f5", "#a5adcb", "#8aadf4", "#181926", "#494d64", "#ed8796"),
  t("catppuccin-frappe", "Catppuccin Frappé", "dark", "Catppuccin", "#303446", "#292c3c", "#414559", "#c6d0f5", "#a5adce", "#babbf1", "#232634", "#51576d", "#e78284"),
  t("catppuccin-latte", "Catppuccin Latte", "light", "Catppuccin", "#eff1f5", "#e6e9ef", "#dce0e8", "#4c4f69", "#6c6f85", "#8839ef", "#eff1f5", "#bcc0cc", "#d20f39"),
  // Nord ×2
  t("nord-polar", "Nord Polar Night", "dark", "Nord", "#2e3440", "#3b4252", "#434c5e", "#eceff4", "#d8dee9", "#88c0d0", "#2e3440", "#4c566a", "#bf616a"),
  t("nord-snow", "Nord Snow Storm", "light", "Nord", "#eceff4", "#e5e9f0", "#d8dee9", "#2e3440", "#4c566a", "#5e81ac", "#eceff4", "#d8dee9", "#bf616a"),
  // Material / mobile OS
  t("material-3", "Material You", "dark", "Google", "#1c1b1f", "#211f26", "#2b2930", "#e6e1e5", "#cac4d0", "#d0bcff", "#381e72", "#49454f", "#f2b8b5"),
  t("liquid-glass", "Liquid Glass", "dark", "Apple-ish", "#0a0f1e", "#0e1527", "#16203a", "#e8eefc", "#93a4c7", "#7cb3ff", "#0b1220", "#243a63", "#8fd3ff"),
  t("classic-apple-light", "Classic Aqua Light", "light", "Apple-ish", "#ececf1", "#e1e1e8", "#f7f7fa", "#1d1d1f", "#6e6e73", "#0066cc", "#ffffff", "#c7c7cf", "#c4314b"),
  t("classic-apple-dark", "Classic Graphite", "dark", "Apple-ish", "#1c1c1e", "#232326", "#2c2c2f", "#f2f2f7", "#a1a1a6", "#4b91f7", "#101012", "#3d3d42", "#ff6b6b"),
  // Windows family
  t("winui", "WinUI Fluent", "dark", "Windows", "#202020", "#282828", "#323232", "#f3f3f3", "#b9b9b9", "#60cdff", "#0c3b51", "#404040", "#ff99a4"),
  t("win10-dark", "Windows 10 Dark", "dark", "Windows", "#1b1b1b", "#222222", "#2d2d2d", "#eeeeee", "#b0b0b0", "#0078d7", "#ffffff", "#3f3f3f", "#e81123"),
  t("win10-light", "Windows 10 Light", "light", "Windows", "#f3f3f3", "#ececec", "#ffffff", "#1b1b1b", "#5f5f5f", "#0078d7", "#ffffff", "#cccccc", "#c50f1f"),
  t("win7-aero", "Windows 7 Aero", "light", "Windows", "#dfeef7", "#cfe4f2", "#ffffff", "#17324a", "#4d6a85", "#1d6fc5", "#ffffff", "#9cc4e0", "#d13438"),
  t("winxp-luna", "Windows XP Luna", "light", "Windows", "#edf3fd", "#dbe7fb", "#ffffff", "#14264a", "#536b9e", "#245edb", "#ffffff", "#a8beea", "#d13438"),
  t("win98", "Windows 98", "light", "Windows", "#008080", "#c0c0c0", "#dfdfdf", "#000000", "#3a3a3a", "#000080", "#ffffff", "#808080", "#c00000"),
  t("win95-hotdog", "Hot Dog Stand", "light", "Windows", "#ffff00", "#ff0000", "#ffff80", "#000000", "#400000", "#ff0000", "#ffffff", "#800000", "#800000"),
  // Bootloaders / terminals
  t("msdos-norton", "Norton Commander", "dark", "Retro", "#0000aa", "#000088", "#0000cc", "#aaaa55", "#5555ff", "#00ffff", "#000000", "#0055aa", "#ffff55"),
  t("grub", "GRUB Menu", "dark", "Bootloader", "#000000", "#111111", "#222222", "#aaaaaa", "#777777", "#ffffff", "#000000", "#444444", "#00aa00"),
  t("limine", "Limine Bootloader", "dark", "Bootloader", "#000000", "#0a0a14", "#12121e", "#36d0e0", "#2a8a96", "#36d0e0", "#001418", "#1e4a52", "#ffd75f"),
  t("linux-tty", "Linux TTY", "dark", "Terminal", "#000000", "#0a0a0a", "#141414", "#33ff33", "#22aa22", "#33ff33", "#000000", "#1f5a1f", "#ff3333"),
  t("amber-crt", "Amber CRT", "dark", "Terminal", "#140b00", "#1e1100", "#2a1800", "#ffb000", "#cc8c00", "#ffc520", "#201100", "#5a3a00", "#ff6644"),
  // Linux desktops
  t("kde-breeze-dark", "KDE Breeze Dark", "dark", "KDE", "#1b1e20", "#232629", "#2b3136", "#eff0f1", "#bdc3c7", "#61afef", "#101619", "#3d454c", "#f47067"),
  t("kde-breeze-light", "KDE Breeze Light", "light", "KDE", "#eff0f1", "#e5e9ec", "#ffffff", "#232629", "#6e7580", "#3daee9", "#ffffff", "#c4cdd4", "#da4453"),
  t("ubuntu-yaru", "Ubuntu Yaru", "dark", "Ubuntu", "#2b2b2b", "#333333", "#3d3d3d", "#f7f7f7", "#b3b3b3", "#e95420", "#ffffff", "#4a4a4a", "#c7162b"),
  // Classic computing
  t("macos9-platinum", "Mac OS 9 Platinum", "light", "Classic Mac", "#dddddd", "#eeeeee", "#f7f7f7", "#000000", "#555555", "#336699", "#ffffff", "#999999", "#990000"),
  t("amiga", "Amiga Workbench", "dark", "Retro", "#0055aa", "#004488", "#1166bb", "#ffffff", "#bbccdd", "#ff8800", "#002244", "#2277cc", "#ff4444"),
  t("c64", "Commodore 64", "dark", "Retro", "#403887", "#352c70", "#4b439a", "#a5a1ff", "#7d79cc", "#a5a1ff", "#201844", "#6a63c0", "#ff7777"),
  t("beos", "BeOS Tracker", "dark", "Retro", "#343434", "#2c2c2c", "#404040", "#e8e8d8", "#a8a890", "#ffc840", "#3a2c00", "#4c4c4c", "#ff6644"),
  // Playful
  t("gameboy-dmg", "Game Boy DMG", "light", "Retro", "#9bbc0f", "#8bac0f", "#c4d640", "#0f380f", "#306230", "#306230", "#9bbc0f", "#7a9a20", "#8b2a2a"),
  t("minecraft", "Minecraft Dirt", "dark", "Games", "#3b2716", "#2e1d10", "#4a3016", "#e8e0c8", "#b0a080", "#6abe30", "#122b08", "#5a4630", "#e04444"),
  t("roblox", "Roblox", "light", "Games", "#f2f4f5", "#e8eaec", "#ffffff", "#191b1d", "#595e66", "#e2231a", "#ffffff", "#c9ccd1", "#b5121b"),
  t("discord", "Discord", "dark", "Apps", "#313338", "#2b2d31", "#383a40", "#dbdee1", "#949ba4", "#5865f2", "#ffffff", "#3f4147", "#fa777c"),
  t("steam", "Steam", "dark", "Games", "#1b2838", "#15202c", "#232f3d", "#c7d5e0", "#8f98a0", "#66c0f4", "#101822", "#2a475e", "#c15757"),
];

export const THEME_IDS = new Set(THEMES.map((x) => x.id));
export const DEFAULT_DARK = "catppuccin-mocha";
export const DEFAULT_LIGHT = "catppuccin-latte";
export const THEME_COOKIE = "rootdb-theme";
export const THEME_MODE_COOKIE = "rootdb-theme-mode";

export function getTheme(id: string | undefined | null): ThemeDef {
  return THEMES.find((x) => x.id === id) ?? THEMES[0];
}

const LIGHT_IDS = THEMES.filter((x) => x.mode === "light").map((x) => x.id);

// Inline no-FOUC snippet (runs before paint): cookie → html data-theme + inline vars.
export function themeInitScript(): string {
  const map = JSON.stringify(Object.fromEntries(THEMES.map((x) => [x.id, x.vars])));
  const lights = JSON.stringify(LIGHT_IDS);
  return `(function(){try{var m=${map},L=${lights};var g=function(n){var mm=document.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]+)'));return mm?decodeURIComponent(mm[1]):'';};var id=g('rootdb-theme');if(!m[id]){id=g('rootdb-theme-mode')==='light'?'${DEFAULT_LIGHT}':'${DEFAULT_DARK}';}var v=m[id],e=document.documentElement;e.setAttribute('data-theme',id);for(var k in v)e.style.setProperty('--'+k,v[k]);e.style.colorScheme=L.indexOf(id)>=0?'light':'dark';}catch(_){}})();`;
}
