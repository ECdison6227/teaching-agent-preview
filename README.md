# 东南大学 · 混凝土结构教学平台

[打开教师工作台](https://ecdison6227.github.io/teaching-agent-preview/)。正式首页采用用户已选 01「课程目录工作台」，黑白 Word 简约风格、深红选题重点和少量蓝色操作标记，使用学校原版校徽。

134 道现成原题按 14 个知识点与题型组织，支持搜索、组合筛选、分页和选题汇总。当前浏览器本地保留选题，刷新可恢复；下载 HTML 选题单自带原公式与配图，可离线打开或通过浏览器打印。不同设备不共享选题。

用户明确允许原题正文、选项、公式和配图公开；不包含答案、源 Word/DOCX/PPT、私有 PDF、学生资料。原题专业内容仍待教师审核。课堂统计、记录和学生入口保持尚无课堂的空状态，后端尚未接入。

源功能 [PR #22](https://github.com/ECdison6227/teaching-agent/pull/22) 使用独立分支，经测试和代码、oil-ui 视觉评审。Pages 从 `preview` 部署分支发布待验收页面，发布不代表源功能已经合并 main；部署分支长期保留。

2026-10-07 用户已验收当前课程目录工作台，按 Squash merge 整理基础版本；`preview` 继续作为长期 Pages 发布源保留。

历史设计对比：[课程目录与紧凑布局](https://ecdison6227.github.io/teaching-agent-preview/designs/seu-workspace/)、[深红强调](https://ecdison6227.github.io/teaching-agent-preview/designs/red-emphasis/)、[早期三个方向](https://ecdison6227.github.io/teaching-agent-preview/designs/)。对比文件保留当轮小样，不代表当前正式页面的所有行为。

本地查看：`python3 -m http.server 5173`，访问 `http://127.0.0.1:5173/`。正式静态文件使用相对路径，可迁移到学校服务器。当前不包含开课同步、真实学生提交及错题 PDF。
