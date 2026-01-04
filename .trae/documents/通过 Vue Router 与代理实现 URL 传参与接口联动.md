## 目标
- 页面通过 URL 传参访问：`/surroundings/listNoPage?surroundingsName=山地`。
- 前端路由接收 `surroundingsName` 并请求后端（mock/真实）接口，展示数据。
- 保持仅根目录 `db.json` 的 json-server 方案。

## 路由与接参
- 新增 `src/router/index.ts`，定义路由：`/surroundings/listNoPage`。
- 在 `src/main.ts` 挂载 router。
- 在当前页面（如 `src/components/HelloWorld.vue`）读取 `query.surroundingsName`。

示例：
```
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/surroundings/listNoPage', component: () => import('@/components/HelloWorld.vue') }
  ]
})
```
```
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
createApp(App).use(router).mount('#app')
```
```
// HelloWorld.vue 中使用
<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
const name = route.query.surroundingsName || ''
</script>
```

## 接口调用
- 通过相对路径请求：`/surroundings/listNoPage?surroundingsName=...`。
- Vite 代理将其重写到 json-server 资源：`/surroundings_listNoPage`，保持 `{status,data}` 结构。

示例：
```
// HelloWorld.vue 中发起请求
const url = '/surroundings/listNoPage?surroundingsName=' + encodeURIComponent(name)
const res = await fetch(url)
const json = await res.json()
// json: { status: 200, data: [...] }
```

## 代理与重写
- 在 `vite.config.js` 增加代理规则：
  - `'/surroundings/listNoPage'` → 重写为 `'/surroundings_listNoPage'`，目标为 `process.env.VITE_BASE_URL || 'http://localhost:3000'`
- 保留已有 `'/surroundings'` 代理（如已存在）。

示例：
```
server: {
  proxy: {
    '/surroundings/listNoPage': {
      target: process.env.VITE_BASE_URL || 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/surroundings\/listNoPage/, '/surroundings_listNoPage')
    }
  }
}
```

## db.json（仅根目录）
- 保持当前结构：顶层 `surroundings_listNoPage`，其值为 `{ status, data }`。
- URL 传参将被后端忽略，但前端仍按参数名控制页面。
- 若需要后端根据参数过滤：可选改法（仍仅 db.json）：将顶层改为数组资源 `surroundings`，前端请求 `GET /surroundings?surroundingsName=山地` 并在前端包装 `{status,data}`。

## 验证
- 启动 mock：`npm run mock`（或 `npx json-server --watch db.json --port 3000`）。
- 启动前端：`npm run dev`。
- 访问：`http://localhost:5173/surroundings/listNoPage?surroundingsName=山地`，确认页面展示与接口返回一致。

## 可配置
- 将真实地址写入 `VITE_BASE_URL`，代理自动转发；生产可直接使用完整基地址 `http(s)://baseurl/surroundings/listNoPage?...`。
