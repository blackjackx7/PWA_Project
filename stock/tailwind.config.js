// 由 scripts/sync.js 從來源 HTML 的 tailwind.config 自動產生，請勿手改
module.exports = {
  "content": [
    "./index.html"
  ],
  "darkMode": "class",
  "theme": {
    "extend": {
      "fontFamily": {
        "sans": [
          "Inter",
          "Noto Sans TC",
          "sans-serif"
        ]
      },
      "colors": {
        "twup": {
          "DEFAULT": "#ef4444",
          "light": "#fef2f2",
          "dark": "#991b1b"
        },
        "twdown": {
          "DEFAULT": "#10b981",
          "light": "#ecfdf5",
          "dark": "#065f46"
        }
      }
    }
  }
};
