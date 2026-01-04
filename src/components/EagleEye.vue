<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    mapInstance: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible']);

const isVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
});

const thumbnailRef = ref(null);
const viewportBoxRef = ref(null);
const thumbnailImage = ref('');
const mapBounds = ref(null); // 地图的完整范围
const viewportBounds = ref(null); // 当前可视区域的范围
const scale = ref(0.1);
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

const L = window.L;

// 获取地图实例的辅助函数
const getMapInstance = () => {
    const mapContainer = props.mapInstance;
    if (!mapContainer) return null;
    return mapContainer.map?.value;
};

// 获取地图缩略图
const generateThumbnail = async () => {
    const map = getMapInstance();
    if (!map || !L) {
        console.warn('地图实例未找到或Leaflet未加载');
        return;
    }

    await nextTick();
    
    // 获取地图的完整范围（所有瓦片的范围）
    const bounds = map.getBounds();
    mapBounds.value = bounds;
    
    // 获取当前可视区域
    const viewBounds = map.getBounds();
    viewportBounds.value = viewBounds;
    
    // 设置缩略图尺寸
    const thumbWidth = 300;
    const thumbHeight = 300;
    
    // 计算地图范围在缩略图中的缩放比例
    const boundsSize = bounds.getNorthEast().distanceTo(bounds.getSouthWest());
    const scaleX = thumbWidth / (bounds.getEast() - bounds.getWest());
    const scaleY = thumbHeight / (bounds.getNorth() - bounds.getSouth());
    scale.value = Math.min(scaleX, scaleY) * 111000; // 转换为像素比例（粗略估算）
    
    // 创建 canvas 来绘制地图缩略图
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = thumbWidth;
    canvas.height = thumbHeight;
    
    // 绘制背景
    ctx.fillStyle = 'rgb(21, 26, 45)';
    ctx.fillRect(0, 0, thumbWidth, thumbHeight);
    
    // 绘制地图区域边框
    ctx.strokeStyle = 'rgb(82, 103, 156)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, thumbWidth, thumbHeight);
    
    // 转换为图片
    thumbnailImage.value = canvas.toDataURL();
    
    updateViewportBox();
};

// 更新可视区域框的位置
const updateViewportBox = () => {
    const map = getMapInstance();
    if (!map || !L || !viewportBoxRef.value || !thumbnailRef.value || !mapBounds.value) return;
    
    const bounds = mapBounds.value;
    const viewBounds = map.getBounds();
    
    // 计算可视区域在缩略图中的位置
    const boundsWidth = bounds.getEast() - bounds.getWest();
    const boundsHeight = bounds.getNorth() - bounds.getSouth();
    
    const viewLeft = ((viewBounds.getWest() - bounds.getWest()) / boundsWidth) * thumbnailRef.value.offsetWidth;
    const viewTop = ((bounds.getNorth() - viewBounds.getNorth()) / boundsHeight) * thumbnailRef.value.offsetHeight;
    const viewWidth = ((viewBounds.getEast() - viewBounds.getWest()) / boundsWidth) * thumbnailRef.value.offsetWidth;
    const viewHeight = ((viewBounds.getNorth() - viewBounds.getSouth()) / boundsHeight) * thumbnailRef.value.offsetHeight;
    
    if (viewportBoxRef.value) {
        viewportBoxRef.value.style.left = Math.max(0, Math.min(viewLeft, thumbnailRef.value.offsetWidth)) + 'px';
        viewportBoxRef.value.style.top = Math.max(0, Math.min(viewTop, thumbnailRef.value.offsetHeight)) + 'px';
        viewportBoxRef.value.style.width = Math.min(viewWidth, thumbnailRef.value.offsetWidth - parseFloat(viewportBoxRef.value.style.left)) + 'px';
        viewportBoxRef.value.style.height = Math.min(viewHeight, thumbnailRef.value.offsetHeight - parseFloat(viewportBoxRef.value.style.top)) + 'px';
    }
};

// 监听地图移动和缩放事件
const handleMapMove = () => {
    if (isVisible.value) {
        updateViewportBox();
    }
};

// 点击鹰眼图跳转到对应位置
const handleThumbnailClick = (e) => {
    const map = getMapInstance();
    if (!map || !L || !thumbnailRef.value || !mapBounds.value) return;
    
    const rect = thumbnailRef.value.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const bounds = mapBounds.value;
    const boundsWidth = bounds.getEast() - bounds.getWest();
    const boundsHeight = bounds.getNorth() - bounds.getSouth();
    
    // 计算点击位置对应的经纬度
    const lng = bounds.getWest() + (x / thumbnailRef.value.offsetWidth) * boundsWidth;
    const lat = bounds.getNorth() - (y / thumbnailRef.value.offsetHeight) * boundsHeight;
    
    // 移动地图到该位置
    map.setView([lat, lng], map.getZoom(), { animate: true });
};

// 开始拖拽
const handleMouseDown = (e) => {
    if (!viewportBoxRef.value) return;
    isDragging.value = true;
    dragStart.value = {
        x: e.clientX,
        y: e.clientY
    };
    e.preventDefault();
};

// 拖拽中
const handleMouseMove = (e) => {
    if (!isDragging.value) return;
    
    const map = getMapInstance();
    if (!map || !L || !thumbnailRef.value || !mapBounds.value || !viewportBoxRef.value) return;
    
    const rect = thumbnailRef.value.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.value.x;
    const deltaY = e.clientY - dragStart.value.y;
    
    // 计算新的可视区域框位置
    const currentLeft = parseFloat(viewportBoxRef.value.style.left) || 0;
    const currentTop = parseFloat(viewportBoxRef.value.style.top) || 0;
    const currentWidth = parseFloat(viewportBoxRef.value.style.width) || 0;
    const currentHeight = parseFloat(viewportBoxRef.value.style.height) || 0;
    
    const newLeft = Math.max(0, Math.min(currentLeft + deltaX, thumbnailRef.value.offsetWidth - currentWidth));
    const newTop = Math.max(0, Math.min(currentTop + deltaY, thumbnailRef.value.offsetHeight - currentHeight));
    
    // 更新可视区域框位置
    viewportBoxRef.value.style.left = newLeft + 'px';
    viewportBoxRef.value.style.top = newTop + 'px';
    
    // 计算对应的地图中心点
    const bounds = mapBounds.value;
    const boundsWidth = bounds.getEast() - bounds.getWest();
    const boundsHeight = bounds.getNorth() - bounds.getSouth();
    
    const centerX = newLeft + currentWidth / 2;
    const centerY = newTop + currentHeight / 2;
    
    const lng = bounds.getWest() + (centerX / thumbnailRef.value.offsetWidth) * boundsWidth;
    const lat = bounds.getNorth() - (centerY / thumbnailRef.value.offsetHeight) * boundsHeight;
    
    // 移动地图
    map.setView([lat, lng], map.getZoom(), { animate: false });
    
    dragStart.value = {
        x: e.clientX,
        y: e.clientY
    };
};

// 结束拖拽
const handleMouseUp = () => {
    isDragging.value = false;
};

// 关闭鹰眼图
const closeEagleEye = () => {
    isVisible.value = false;
};

let mapEventHandlers = [];

watch(() => props.visible, (newVal) => {
    if (newVal) {
        nextTick(() => {
            // 等待地图实例准备好
            const getMap = () => {
                const mapContainer = props.mapInstance;
                if (!mapContainer) return null;
                
                // mapContainer 是一个组件引用，需要通过 .map.value 访问
                const map = mapContainer.map?.value;
                return map;
            };
            
            const map = getMap();
            if (!map || !L) {
                console.warn('地图实例未找到，等待地图初始化...');
                // 延迟重试
                setTimeout(() => {
                    const retryMap = getMap();
                    if (retryMap && isVisible.value) {
                        setupMapListeners(retryMap);
                    }
                }, 500);
                return;
            }
            
            setupMapListeners(map);
        });
    } else {
        // 移除地图事件监听
        const map = getMapInstance();
        if (map && L) {
            mapEventHandlers.forEach(({ event, handler }) => {
                map.off(event, handler);
            });
        }
        mapEventHandlers = [];
    }
});

// 设置地图事件监听
const setupMapListeners = (map) => {
    if (!map || !L) return;
    
    // 先移除旧的事件监听
    mapEventHandlers.forEach(({ event, handler }) => {
        map.off(event, handler);
    });
    mapEventHandlers = [];
    
    generateThumbnail();
    
    // 监听地图事件
    const moveHandler = () => {
        if (isVisible.value) {
            updateViewportBox();
        }
    };
    
    const moveEndHandler = () => {
        if (isVisible.value) {
            updateViewportBox();
        }
    };
    
    const zoomHandler = () => {
        if (isVisible.value) {
            generateThumbnail();
            updateViewportBox();
        }
    };
    
    map.on('move', moveHandler);
    map.on('moveend', moveEndHandler);
    map.on('zoom', zoomHandler);
    map.on('zoomend', zoomHandler);
    
    mapEventHandlers = [
        { event: 'move', handler: moveHandler },
        { event: 'moveend', handler: moveEndHandler },
        { event: 'zoom', handler: zoomHandler },
        { event: 'zoomend', handler: zoomHandler }
    ];
};

// 监听地图实例变化
watch(() => props.mapInstance?.map?.value, (newMap) => {
    if (newMap && isVisible.value) {
        nextTick(() => {
            setupMapListeners(newMap);
        });
    }
}, { immediate: true });

onMounted(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
});

onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    const map = getMapInstance();
    if (map && L) {
        mapEventHandlers.forEach(({ event, handler }) => {
            map.off(event, handler);
        });
    }
    mapEventHandlers = [];
});
</script>

<template>
    <div v-if="isVisible" class="eagle-eye-container">
        <div class="eagle-eye-header">
            <h3 class="eagle-eye-title">鹰眼图</h3>
            <span class="eagle-eye-close" @click="closeEagleEye">×</span>
        </div>
        <div 
            ref="thumbnailRef"
            class="eagle-eye-thumbnail"
            @click="handleThumbnailClick"
            @mousedown="handleMouseDown"
        >
            <img 
                v-if="thumbnailImage"
                :src="thumbnailImage"
                alt="地图缩略图"
                style="width: 100%; height: 100%; object-fit: contain;"
            />
            <div 
                ref="viewportBoxRef"
                class="viewport-box"
            ></div>
        </div>
    </div>
</template>

<style scoped lang="scss">
// 主题色变量
$theme-bg-color: rgb(21, 26, 45);
$theme-text-color: rgb(101, 171, 223);
$theme-button-color: rgb(26, 49, 116);
$theme-border-color: rgb(82, 103, 156);

.eagle-eye-container {
    position: fixed;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 320px;
    background-color: $theme-bg-color;
    border: 1px solid $theme-border-color;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
    z-index: 2000;
    display: flex;
    flex-direction: column;
}

.eagle-eye-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid $theme-border-color;

    .eagle-eye-title {
        margin: 0;
        color: $theme-text-color;
        font-size: 14px;
        font-weight: bold;
    }

    .eagle-eye-close {
        color: $theme-text-color;
        font-size: 20px;
        cursor: pointer;
        line-height: 1;
        transition: color 0.3s ease;

        &:hover {
            color: lighten($theme-text-color, 20%);
        }
    }
}

.eagle-eye-thumbnail {
    position: relative;
    width: 300px;
    height: 300px;
    margin: 10px;
    border: 1px solid $theme-border-color;
    background-color: rgba(26, 49, 116, 0.3);
    cursor: crosshair;
    overflow: hidden;
}

.viewport-box {
    position: absolute;
    border: 2px solid #64c3ed;
    background-color: rgba(100, 195, 237, 0.2);
    pointer-events: none;
    box-sizing: border-box;
    transition: all 0.1s ease;
}
</style>
