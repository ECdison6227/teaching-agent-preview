# 专题教学空间 · 前端评审预览

这是给教师评审的平台界面演示，使用另写的示例题和本浏览器内存数据。

已选方向01，当前主页采用黑白Word简约风格，少量蓝色标记选中状态。[打开教师工作台](https://ecdison6227.github.io/teaching-agent-preview/)。

[本轮深红重点对比](https://ecdison6227.github.io/teaching-agent-preview/designs/red-emphasis/)：当前版与三种强调范围，等待用户选择。首页暂不应用推荐方案。

[早期三套界面对比](https://ecdison6227.github.io/teaching-agent-preview/designs/)保留作为设计历史。

- 教师按知识点和题型组合筛选、选择示例题，预览一组课堂。
- 加载程序生成的答卷，查看示例选项分布。
- 切换学生视角，体验选项和本页提交确认。

所有数据均为演示。没有真实题库、正确答案、课件、学生记录或课堂后端。刷新清空数据，不同设备不会同步。真实题库 PDF 由项目维护者单独交付给教师审核。

Pages 从 `preview` 部署分支发布待验收页面；部署预览不等于源功能 PR 已合并。`preview` 长期保留为发布源，不随 PR 合并自动删除。

本地查看：`python3 -m http.server 5173`，访问 `http://127.0.0.1:5173/`。静态文件全部使用相对路径，可迁移到学校服务器；正式接口在后续版本接入。
