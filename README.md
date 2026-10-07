# 东南大学 · 混凝土结构教学平台

[打开教师工作台](https://ecdison6227.github.io/teaching-agent-preview/)。正式首页采用用户已选 01「课程目录工作台」，黑白 Word 简约风格、深红选题重点和少量蓝色操作标记，使用学校原版校徽。

[打开课堂题目组与准备](https://ecdison6227.github.io/teaching-agent-preview/workspace.html)：采用用户已选05·01「独立页面 · 灰框题卡」（深化04改选02）。题目组列表、编辑、选题、课堂准备与只读预览分开显示。每题默认展示完整题干、选项、公式与配图，灰框明确分隔。教师先命名、增删、调序并保存题目组，上课填写名称、日期并选择已保存组。

题组、未保存草稿、课堂准备分别在当前浏览器保存，刷新可恢复，其他设备不共享。保存失败时保留当前输入并提示；浏览器禁止写入时不能承诺刷新恢复。课堂预览使用已保存组的顺序；真实开课、二维码和学校后端尚未接入，开始上课不可用。

源 [PR #26](https://github.com/ECdison6227/teaching-agent/pull/26)、设计留档 [PR #28](https://github.com/ECdison6227/teaching-agent/pull/28) 与公开发布 [PR #4](https://github.com/ECdison6227/teaching-agent-preview/pull/4) 已于2026-10-07经用户体验验收Squash合并main。20项Node、11项Python检查与3轮T3原生浏览器检查通过，每轮28项。静态画面与200% CSS重排已查看；录屏包含末尾短暂切换，完整动态视觉证据仍待补，不冒充完整视觉验收。

134 道现成原题按 14 个知识点与题型组织，支持搜索、组合筛选、分页和选题汇总。当前浏览器本地保留选题，刷新可恢复；下载 HTML 选题单自带原公式与配图，可离线打开或通过浏览器打印。不同设备不共享选题。

用户明确允许原题正文、选项、公式和配图公开；不包含答案、源 Word/DOCX/PPT、私有 PDF、学生资料。原题专业内容仍待教师审核。课堂统计、记录和学生入口保持尚无课堂的空状态，后端尚未接入。

源功能 [PR #22](https://github.com/ECdison6227/teaching-agent/pull/22) 使用独立分支，经测试和代码、oil-ui 视觉评审，用户验收后已合并。Pages 从长期保留的 `preview` 分支部署；新的设计候选发布不代表它们已获用户验收或已合并源功能。

2026-10-07 用户已验收当前课程目录工作台，按 Squash merge 整理基础版本；`preview` 继续作为长期 Pages 发布源保留。

[选题组与课堂准备设计留档](https://ecdison6227.github.io/teaching-agent-preview/designs/classroom-workspace/)：历史第04轮先选01，后改选02；第05轮选择独立页面与灰框题卡，以正式工作台最新实现为准。候选采用现成原题，可调整顺序、增删、命名及保存；对比工具使用会话内存，关闭页面后清空，不作为正式题组管理工具。未接真实开课或扫码。两版各3轮原生浏览器交互检查通过；新截图与录屏导出接口故障，视觉和动效画面验收待补。正式功能通过后续独立PR交付，不将设计选择等同于功能验收。

历史设计对比：[课程目录与紧凑布局](https://ecdison6227.github.io/teaching-agent-preview/designs/seu-workspace/)、[深红强调](https://ecdison6227.github.io/teaching-agent-preview/designs/red-emphasis/)、[早期三个方向](https://ecdison6227.github.io/teaching-agent-preview/designs/)。对比文件保留当轮小样，不代表当前正式页面的所有行为。

本地查看：`python3 -m http.server 5173`，访问 `http://127.0.0.1:5173/`。正式静态文件使用相对路径，可迁移到学校服务器。当前不包含开课同步、真实学生提交及错题 PDF。

[第06轮：授课与学生答题设计对比](https://ecdison6227.github.io/teaching-agent-preview/designs/teaching-session/)：01逐题授课、同页翻题；02大字投屏、独立控制。入口、统计和学生作答分开；4道现成原题仅用于比较界面，选项与填空保存在候选会话内存。发布、二维码、提交及PDF不可用，没有答案或假成功。由oil-ui开源版0.16.6生成，源设计[PR #30](https://github.com/ECdison6227/teaching-agent/pull/30)保持Draft，等待本轮选择；正式前端不改。两版6轮108项原生交互检查、来源与语法检查通过。桌面/手机录屏帧已查看，CSS zoom不等于系统缩放，完整动效验证仍有限制。
