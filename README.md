# 多科目闪卡

基于原生 HTML、CSS 和 JavaScript 的考研背诵闪卡网站。

## 本地运行

由于页面通过 `fetch` 读取章节 JSON，需要通过 HTTP 服务器访问，不能直接双击 `index.html`。

```bash
python -m http.server 8000
```

然后打开：

```text
http://127.0.0.1:8000/
```

## 部署到 GitHub Pages

1. 将本目录中的所有文件上传到 GitHub 仓库根目录。
2. 打开仓库的 `Settings` → `Pages`。
3. 在 `Build and deployment` 中选择 `Deploy from a branch`。
4. 选择 `main` 分支和 `/ (root)` 目录并保存。
5. 等待 GitHub Pages 生成访问地址。

## 文件结构

```text
index.html          页面结构
style.css           页面样式
app.js              页面与进度逻辑
config.json         科目及章节目录
md_ch*.json         机械设计章节数据
md_a*.json          机械设计附录数据
mp_ch*.json         机械原理章节数据
pol_marx_ch*.json   政治-马原章节数据
```

## 数据格式

每个章节 JSON 文件使用以下结构：

```json
[
  {
    "question": "问题",
    "answer": "答案",
    "keyword": "关键词"
  }
]
```

新增章节时，在 `config.json` 的对应科目中添加章节配置，并创建以章节 `id` 命名的 JSON 文件。

科目对象支持可选的 `comingSoon` 布尔字段。设置为 `true` 时，科目大厅卡片会显示“选择题/连线题开发中”提示；设置为 `false` 或省略时不显示。

科目还支持可选的 `groups` 数组，用于表示科目内的小科目或分组。章节通过 `group` 字段关联到对应分组；没有章节的分组会显示为内容整理中。
