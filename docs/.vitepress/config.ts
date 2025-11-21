import { defineConfig } from "vitepress"

export default defineConfig({
  lang: "zh-CN",
  title: "@fonds/eslint-config",
  description: "Fonds Tech 的 ESLint Flat Config 工厂",
  srcDir: "./",
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: "快速上手", link: "/getting-started" },
      { text: "配置项", link: "/options" },
      { text: "格式化器", link: "/formatters" },
      { text: "GitHub", link: "https://github.com/fonds-tech/eslint-config" },
    ],
    sidebar: [
      {
        text: "指南",
        items: [
          { text: "概览", link: "/" },
          { text: "快速上手", link: "/getting-started" },
        ],
      },
      {
        text: "进阶",
        items: [
          { text: "配置项参考", link: "/options" },
          { text: "格式化器指南", link: "/formatters" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/fonds-tech/eslint-config" },
    ],
    editLink: {
      pattern: "https://github.com/fonds-tech/eslint-config/edit/main/docs/:path",
      text: "在 GitHub 上编辑此页",
    },
    lastUpdatedText: "最近更新",
  },
})
