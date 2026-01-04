## 目标

* 通过 URL 传参 `surroundingsName`，提供 GET 接口：`{BASE_URL}/surroundings/listNoPage?surroundingsName=山地`。

* 返回结构需为：`{ status: 200, data: [...] }`。

* `BASE_URL` 为占位符，您自行填写（本地可用 `http://localhost:3000`）。

## 数据（新增 5 条）

* 按要求仅变动 `id`（0–30 随机），其余字段与示例保持一致。

* 追加的 5 条：

```
{
  "status": 200,
  "data": [
    { "id": 3,  "surroundingsName": "山地", "isTemplateData": "0", "terrain": "2", "weather": "3", "seaState": "2", "flow": 4 },
    { "id": 7,  "surroundingsName": "山地", "isTemplateData": "0", "terrain": "2", "weather": "3", "seaState": "2", "flow": 4 },
    { "id": 12, "surroundingsName": "山地", "isTemplateData": "0", "terrain": "2", "weather": "3", "seaState": "2", "flow": 4 },
    { "id": 19, "surroundingsName": "山地", "isTemplateData": "0", "terrain": "2", "weather": "3", "seaState": "2", "flow": 4 },
    { "id": 28, "surroundingsName": "山地", "isTemplateData": "0", "terrain": "2", "weather": "3", "seaState": "2", "flow": 4 }
  ]
}
```

* 如果需要包含您已写的那条（`id:24`），可将其与以上 5 条合并到数据源中。

## 实施步骤

1. 安装工具：将 `json-server` 作为开发依赖。
2. 新增文件 `mock/db.json`：

   * 结构建议：

```
{
  "surroundings": [
    { "id": 24, "surroundingsName": "山地", "isTemplateData": "0", "terrain": "2", "weather": "3", "seaState": "2", "flow": 4 },
    { "id": 3,  "surroundingsName": "山地", "isTemplateData": "0", "terrain": "2", "weather": "3", "seaState": "2", "flow": 4 },
    { "id": 7,  "surroundingsName": "山地", "isTemplateData": "0", "terrain": "2", "weather": "3", "seaState": "2", "flow": 4 },
    { "id": 12, "surroundingsName": "山地", "isTemplateData": "0", "terrain": "2", "weather": "3", "seaState": "2", "flow": 4 },
    { "id": 19, "surroundingsName": "山地", "isTemplateData": "0", "terrain": "2", "weather": "3", "seaState": "2", "flow": 4 },
    { "id": 28, "surroundingsName": "山地", "isTemplateData": "0", "terrain": "2", "weather": "3", "seaState": "2", "flow": 4 }
  ]
}
```

1. 路由重写 `mock/routes.json`：将 `/surroundings/listNoPage` 重写为 `/surroundings`

```
{
  "/surroundings/listNoPage": "/surroundings"
}
```

1. 自定义响应包装 `mock/server.js`：在 `json-server` 中拦截响应，把默认数组包装为 `{status:200,data:[...]}`。

```
const jsonServer = require('json-server')
const server = jsonServer.create()
const router = jsonServer.router('mock/db.json')
const middlewares = jsonServer.defaults()
server.use(middlewares)
server.use(jsonServer.rewriter({ '/surroundings/listNoPage': '/surroundings' }))
server.use((req, res, next) => {
  const originalSend = res.send.bind(res)
  res.send = (body) => {
    try {
      const data = JSON.parse(body)
      res.jsonp({ status: 200, data })
    } catch {
      originalSend(body)
    }
  }
  next()
})
server.use(router)
server.listen(3000, () => console.log('Mock at http://localhost:3000'))
```

1. 启动命令：新增 `npm run mock`（例如：`node mock/server.js`）。
2. 前端请求方式：

   * 直接调用：`${BASE_URL}/surroundings/listNoPage?surroundingsName=山地`。

   * 或在 `vite.config.ts` 中代理 `/surroundings` 到 `BASE_URL`，前端用相对路径：`/surroundings/listNoPage?surroundingsName=山地`，避免 CORS。

## 使用说明

* 打开页面：`http://localhost:5173/`。

* 另一系统

