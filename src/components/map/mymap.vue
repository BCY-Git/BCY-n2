<template>
  <!-- 地图容器：Leaflet 会将地图渲染到这个 div 内 -->
  <div id="leaflet-map" class="leaflet-map"></div>
</template>

<script setup>
// 模块说明：
// - 这是一个通用的 Leaflet 地图组件
// - 面向初学者，每一步都有清晰注释，便于理解与二次开发

import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

// 依赖说明：
// - Leaflet 通过全局 window.L 引入（请在 index.html 中引入 leaflet.js 和 leaflet.css）
const L = window.L

// 状态说明：
// - map：保存 Leaflet 地图实例，便于在其他方法中使用或销毁
const map = ref(null)

// 输入参数（props）：
// - center：地图中心点 [纬度, 经度]
// - zoom：初始缩放级别
// - zoomControl：是否显示左上角的缩放控件
// - tileLayerUrl：瓦片图层地址（默认使用 OSM）
// - tileLayerAttribution：版权信息（会显示在右下角）
// - maxZoom/minZoom：最大/最小缩放级别限制
const props = defineProps({
  center: { type: Array, default: () => [35.0, 105.0] },
  zoom: { type: Number, default: 5 },
  zoomControl: { type: Boolean, default: true },
  // 默认使用高德地图矢量底图（HTTPS 域名 wprd）
  tileLayerUrl: { type: String, default: 'https://wprd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=7&x={x}&y={y}&z={z}' },
  tileLayerAttribution: { type: String, default: '&copy; AMap (高德地图)' },
  // 高德子域名 1-4
  tileLayerSubdomains: { type: Array, default: () => ['1', '2', '3', '4'] },
  maxZoom: { type: Number, default: 19 },
  minZoom: { type: Number, default: 3 }
})

// 核心方法：初始化地图
// 步骤概览：
// 1）检查 Leaflet 是否可用
// 2）获取并校验 DOM 容器
// 3）清理旧的地图实例（避免重复渲染导致错误）
// 4）创建地图，设置中心点、缩放与控件
// 5）添加瓦片图层（底图）
const initMap = () => {
  // 1）检查 Leaflet 可用性
  if (!window.L) return
  // 2）获取 DOM 容器
  const el = document.getElementById('leaflet-map')
  if (!el) return
  // 3）清理旧实例
  if (map.value) {
    map.value.remove()
    map.value = null
  }
  // 4）等待下一次 DOM 更新后创建地图（确保容器尺寸已就绪）
  nextTick(() => {
    setTimeout(() => {
      const container = document.getElementById('leaflet-map')
      if (!container) return
      // 5）创建地图实例
      map.value = L.map('leaflet-map', {
        center: props.center,
        zoom: props.zoom,
        zoomControl: props.zoomControl,
        minZoom: props.minZoom,
        maxZoom: props.maxZoom
      })
      // 6）添加瓦片图层（底图）
      const amapLayer = L.tileLayer(props.tileLayerUrl, {
        attribution: props.tileLayerAttribution,
        subdomains: props.tileLayerSubdomains,
        maxZoom: props.maxZoom,
        crossOrigin: true
      }).addTo(map.value)
      // 瓦片加载失败时回退到 OSM，提升可用性
      amapLayer.on('tileerror', () => {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: props.maxZoom,
          subdomains: ['a', 'b', 'c']
        }).addTo(map.value)
      })
    }, 50)
  })
}

// 生命周期：组件挂载后初始化地图
onMounted(() => {
  initMap()
})

// 生命周期：组件卸载前销毁地图，释放资源
onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})

// 响应式：当中心点变化时，平移到新的位置
watch(() => props.center, (val) => {
  if (map.value && Array.isArray(val) && val.length === 2) {
    map.value.setView(val, map.value.getZoom())
  }
})

// 响应式：当缩放级别变化时，更新地图缩放
watch(() => props.zoom, (val) => {
  if (map.value && typeof val === 'number') {
    map.value.setZoom(val)
  }
})

// 对外暴露：
// - map：当前地图实例（可用于添加覆盖物、事件等）
// - initMap：手动触发初始化（当父组件需要时）
defineExpose({ map, initMap })
</script>

<style scoped lang="scss">
.leaflet-map {
  // 容器说明：
  // - 地图会占满父容器，请确保父容器设置了明确的宽高
  width: 100%;
  height: 100%;
}

:deep(.leaflet-control-container) {
  // 允许交互：
  // - 确保缩放控件、图层控件等可点击
  pointer-events: auto;
  z-index: 1000;
}
:deep(.leaflet-pane) {
  // 允许地图与覆盖物交互（拖拽、点击等）
  pointer-events: auto;
}
</style>
