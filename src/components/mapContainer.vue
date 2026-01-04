<template>
    <div id="fullscreen-map" class="fullscreen-map"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';

// 注意：leaflet CSS 和 JS 在 index.html 中通过 link 和 script 标签引入
const L = window.L;
const map = ref(null); // 地图实例

// 定义 props，允许外部传入配置
const props = defineProps({
    // 地图中心点坐标 [纬度, 经度]
    center: {
        type: Array,
        default: () => [39.9042, 116.4074] // 默认北京坐标
    },
    // 初始缩放级别
    zoom: {
        type: Number,
        default: 10
    },
    // 是否显示缩放控件
    zoomControl: {
        type: Boolean,
        default: true
    },
    // 瓦片图层 URL
    tileLayerUrl: {
        type: String,
        default: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    },
    // 瓦片图层属性
    tileLayerAttribution: {
        type: String,
        default: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    // 最大缩放级别
    maxZoom: {
        type: Number,
        default: 19
    }
});

// 初始化地图
const initMap = () => {
    // 检查 Leaflet 是否已加载
    if (!window.L) {
        console.error('Leaflet 未加载，请检查 /dist/leaflet.js 是否正确引入');
        return;
    }

    // 确保地图容器存在
    const mapContainer = document.getElementById('fullscreen-map');
    if (!mapContainer) {
        console.error('地图容器不存在');
        return;
    }

    // 如果地图已存在，先移除
    if (map.value) {
        map.value.remove();
        map.value = null;
    }

    // 等待 DOM 完全渲染后再初始化地图
    nextTick(() => {
        setTimeout(() => {
            const container = document.getElementById('fullscreen-map');
            if (!container) {
                console.error('地图容器不存在');
                return;
            }

            // 初始化地图，设置中心点和缩放级别
            map.value = L.map('fullscreen-map', {
                center: props.center,
                zoom: props.zoom,
                zoomControl: props.zoomControl,
                minZoom: 3, // 最小缩放级别
                maxZoom: props.maxZoom, // 最大缩放级别
                dragging: true, // 启用拖拽
                scrollWheelZoom: true, // 启用鼠标滚轮缩放
                doubleClickZoom: true, // 启用双击缩放
                boxZoom: true, // 启用框选缩放
                keyboard: true, // 启用键盘导航
                touchZoom: true, // 启用触摸缩放（移动端）
                zoomAnimation: true, // 启用缩放动画
            });

            // 添加瓦片图层
            L.tileLayer(props.tileLayerUrl, {
                attribution: props.tileLayerAttribution,
                maxZoom: props.maxZoom,
            }).addTo(map.value);

            // 地图加载完成后的回调
            map.value.whenReady(() => {
                console.log('地图初始化完成');
            });
        }, 100);
    });
}

// 暴露地图实例，供父组件使用
defineExpose({
    map,
    initMap
});

// 组件挂载时初始化地图
onMounted(() => {
    initMap();
});

// 组件卸载前清理地图
onBeforeUnmount(() => {
    if (map.value) {
        map.value.remove();
        map.value = null;
    }
});
</script>

<style scoped lang="scss">
.fullscreen-map {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0; // 地图在最底层
    pointer-events: auto; // 确保可以交互
    touch-action: none; // 防止默认触摸行为
}

// 确保 Leaflet 控件可以交互
:deep(.leaflet-control-container) {
    pointer-events: auto;
    z-index: 1000;
}

:deep(.leaflet-pane) {
    pointer-events: auto;
}
</style>

