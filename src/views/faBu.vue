<script setup>
import axios from 'axios';
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { terrainMap, typeMap, weatherMap, seaStateMap } from '@/utils/dict';
import MapContainer from '@/components/mapContainer.vue';
import ImageDialog from '@/components/ImageDialog.vue';
import EagleEye from '@/components/EagleEye.vue';
import { publishApi } from '@/api/publish.js';// 发布接口



const mapContainerRef = ref(null);
const list = ref([]);
const mockData = ref([]);
const currentEditItem = ref(null);
const isSidebarCollapsed = ref(false);
const dialogVisible1 = ref(false);
const dialogVisible2 = ref(false);
const dialogVisible3 = ref(false);
const dialogVisible4 = ref(false);
const dialogVisible5 = ref(false);
const dialogVisible6 = ref(false);
const dialogVisible7 = ref(false);
const dialogVisible8 = ref(false);
const eagleEyeVisible = ref(false); // 鹰眼图显示状态
const imageSrc6 = ref(''); // 图片6的路径
const imageSrc7 = ref(''); // 图片7的路径
const imageSrc8 = ref(''); // 图片8的路径
const selectedSide = ref('red'); // 默认选中红方
const searchKeyword = ref(''); // 搜索关键词
// 测量距离相关
const isMeasuring = ref(false); // 是否处于测量模式
const measurePoints = ref([]); // 存储测量点
const measureLine = ref(null); // 测量直线
const measureMarkers = ref([]); // 测量点标记
const measureLabel = ref(null); // 距离标签
const isEditMode = computed(() => {
    if (!currentEditItem.value) return false;
    const id = currentEditItem.value.id;
    // 只有当 id 存在且不是空字符串时，才是编辑模式
    return id !== undefined && id !== null && id !== '';
});
const getMockData = async () => {
    try {
        const res = await axios.get('/api/drillingOnlineStatus');
        console.log(res.data.data);
        mockData.value = res.data.data;
    } catch (error) {
        console.warn('获取状态监控数据失败:', error.message);
        // 使用空对象作为默认值
        mockData.value = {};
    }
}
getMockData();

const getTaskList = async () => {
    try {
        const res = await publishApi.getTaskList();
        console.log('获取的任务列表:', res.data);
        const raw = res.data.data || res.data;
        // 映射 terrain 和 type 用于显示，同时添加用于编辑的数组格式
        list.value = raw.map(item => {
            const typeArray = strToArray(item.type);
            const equipmentArray = strToArray(item.equipment);
            return {
                ...item,
                terrainDisplay: terrainMap[item.terrain] || item.terrain,
                typeList: getTypeList(item.type),
                typeArray,
                equipmentArray
            };
        });
    } catch (error) {
        console.warn('获取任务列表失败:', error.message);
        // 保持 list.value 为空数组
        list.value = [];
    }
}
getTaskList();
const handlePublish = async (id) => {
    const taskItem = list.value.find(item => item.id === id);
    if (!taskItem) return;
    try {
        // 精简写法：三元表达式替代if/else，逻辑不变
        const targetStatus = taskItem.publishStatus === 0 ? '0' : '1';
        await publishApi.updataStatus({ id, publishStatus: targetStatus });
        await getTaskList(); // 刷新列表
    } catch (error) {
        console.error('发布任务失败:', error.message);
    }
}

const startTask = async (id, taskId) => {
    try {
        const res = await axios.patch("/api/drill/updateDrillStatus", {
            id: id,
            taskId: taskId,
            status: "1"
        });
        console.log(res.data);
        getTaskList();
    } catch (error) {
        console.error('启动任务失败:', error.message);
    }
}

const getStatus = async () => {
    try {
        const res = await fetchGet('/drill');
        console.log(res);
        return res;
    } catch (error) {
        console.warn('获取状态失败:', error.message);
        return null;
    }
}
getStatus();
// 处理 type 字段映射，返回映射后的数组
const getTypeList = (typeStr) => {
    if (!typeStr) return []
    // 如果是字符串且包含逗号，则分割后映射
    if (typeof typeStr === 'string' && typeStr.includes(',')) {
        return typeStr.split(',').map(t => typeMap[t.trim()] || t.trim())
    }
    // 单个值直接映射为数组
    return [typeMap[typeStr] || typeStr]
}

// 切换侧边栏显示/隐藏
const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
}
// 打开/关闭弹窗
const openDialog = (dialogNumber) => {
    switch (dialogNumber) {
        case 1:
            dialogVisible1.value = true;
            break;
        case 2:
            dialogVisible2.value = true;
            break;
        case 3:
            dialogVisible3.value = true;
            break;
        case 4:
            dialogVisible4.value = true;
            break;
        case 5:
            dialogVisible5.value = true;
            break;
        case 6:
            dialogVisible6.value = true;
            break;
        case 7:
            dialogVisible7.value = true;
            break;
        case 8:
            dialogVisible8.value = true;
            break;
        case 9:
            eagleEyeVisible.value = !eagleEyeVisible.value;
            break;
    }
}

const closeDialog = (dialogNumber) => {
    switch (dialogNumber) {
        case 1:
            dialogVisible1.value = false;
            break;
        case 2:
            dialogVisible2.value = false;
            break;
        case 3:
            dialogVisible3.value = false;
            break;
        case 4:
            dialogVisible4.value = false;
            break;
        case 5:
            dialogVisible5.value = false;
            break;
        case 6:
            dialogVisible6.value = false;
            break;
        case 7:
            dialogVisible7.value = false;
            break;
        case 8:
            dialogVisible8.value = false;
            break;
    }
}

// 切换红方/蓝方选中状态
const selectSide = (side) => {
    selectedSide.value = side;
}

// 过滤列表，根据 taskName 进行搜索
const filteredList = computed(() => {
    if (!searchKeyword.value.trim()) {
        return list.value;
    }
    const keyword = searchKeyword.value.trim().toLowerCase();
    return list.value.filter(item => {
        const taskName = item.taskName || '';
        return taskName.toLowerCase().includes(keyword);
    });
})

// 扁平化 taskList 数据用于表格显示
const flatTaskList = computed(() => {
    const result = [];
    taskList.value.forEach(item => {
        if (Array.isArray(item)) {
            result.push(...item);
        } else {
            result.push(item);
        }
    });
    return result;
})

// 计算两点之间的距离（米）
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 格式化距离显示
const formatDistance = (distance) => {
    if (distance < 1000) {
        return distance.toFixed(2) + ' 米';
    } else {
        return (distance / 1000).toFixed(2) + ' 公里';
    }
}

// 清除测量结果
const clearMeasure = () => {
    const L = window.L;
    if (!L) return;

    if (measureLine.value) {
        measureLine.value.remove();
        measureLine.value = null;
    }
    if (measureLabel.value) {
        measureLabel.value.remove();
        measureLabel.value = null;
    }
    measureMarkers.value.forEach(marker => {
        marker.remove();
    });
    measureMarkers.value = [];
    measurePoints.value = [];
}

// 切换测量模式
const toggleMeasure = () => {
    isMeasuring.value = !isMeasuring.value;
    console.log('测量模式:', isMeasuring.value ? '开启' : '关闭');

    // 确保地图实例存在
    const map = getMapInstance();
    if (!map) {
        console.warn('无法切换测量模式：地图实例不存在');
        // 尝试重新初始化
        setTimeout(() => {
            initMeasure();
        }, 500);
        return;
    }

    if (!isMeasuring.value) {
        // 退出测量模式，清除测量结果
        clearMeasure();
    } else {
        // 进入测量模式，确保事件已绑定
        if (!mapClickHandler) {
            initMeasure();
        }
    }
}

// 获取地图实例
const getMapInstance = () => {
    if (!mapContainerRef.value) return null;
    if (!mapContainerRef.value.map) return null;
    if (!mapContainerRef.value.map.value) return null;
    return mapContainerRef.value.map.value;
}

// 地图点击事件处理函数
let mapClickHandler = null;

// 初始化地图测量功能
const initMeasure = () => {
    const L = window.L;
    if (!L) {
        console.warn('Leaflet 未加载');
        return;
    }

    const map = getMapInstance();
    if (!map) {
        console.warn('地图实例未找到');
        return;
    }

    // 如果已经绑定过事件，先移除
    if (mapClickHandler) {
        map.off('click', mapClickHandler);
    }

    // 绑定地图点击事件
    mapClickHandler = (e) => {
        if (!isMeasuring.value) return;

        const latlng = e.latlng;
        console.log('测量模式：点击了地图', latlng);

        // 如果已经有完整的测量结果（两个点），点击新点时清除之前的测量
        if (measurePoints.value.length === 0 && (measureLine.value || measureMarkers.value.length > 0)) {
            clearMeasure();
        }

        measurePoints.value.push(latlng);

        // 添加标记点
        const marker = L.marker(latlng, {
            icon: L.divIcon({
                className: 'measure-marker',
                html: '<div style="width: 12px; height: 12px; background-color: #ff0000; border: 2px solid #fff; border-radius: 50%;"></div>',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })
        }).addTo(map);
        measureMarkers.value.push(marker);

        // 如果有两个点，绘制直线并显示距离
        if (measurePoints.value.length === 2) {
            // 清除之前的直线和标签（如果存在）
            if (measureLine.value) {
                measureLine.value.remove();
            }
            if (measureLabel.value) {
                measureLabel.value.remove();
            }

            // 绘制直线
            const point1 = measurePoints.value[0];
            const point2 = measurePoints.value[1];
            measureLine.value = L.polyline([point1, point2], {
                color: '#ff0000',
                weight: 2,
                opacity: 0.8
            }).addTo(map);

            // 计算距离
            const distance = calculateDistance(
                point1.lat, point1.lng,
                point2.lat, point2.lng
            );

            // 在中间位置显示距离标签
            const midLat = (point1.lat + point2.lat) / 2;
            const midLng = (point1.lng + point2.lng) / 2;
            measureLabel.value = L.marker([midLat, midLng], {
                icon: L.divIcon({
                    className: 'measure-label',
                    html: `<div style="background-color: rgba(0, 0, 0, 0.7); color: #fff; padding: 4px 8px; border-radius: 4px; white-space: nowrap; font-size: 12px;">${formatDistance(distance)}</div>`,
                    iconSize: [100, 20],
                    iconAnchor: [50, 10]
                }),
                zIndexOffset: 1000
            }).addTo(map);

            // 重置测量点数组，但保留标记以便查看
            // 下次点击时会清除所有测量结果并开始新的测量
            measurePoints.value = [];
        }
    };

    map.on('click', mapClickHandler);
    console.log('测量功能初始化完成');
}

// 监听地图实例，当地图准备好后初始化测量功能
watch(() => mapContainerRef.value?.map?.value, (mapInstance) => {
    if (mapInstance) {
        nextTick(() => {
            setTimeout(() => {
                initMeasure();
            }, 500);
        });
    }
}, { immediate: true });

// 组件挂载后尝试初始化测量功能
onMounted(() => {
    // 延迟初始化，确保地图组件已完全加载
    setTimeout(() => {
        const map = getMapInstance();
        if (map) {
            initMeasure();
        } else {
            // 如果地图还没准备好，再等待一段时间
            setTimeout(() => {
                initMeasure();
            }, 1000);
        }
    }, 800);
})
</script>
<template>
    <div class="thinking-container">
        <!-- 全屏地图背景 -->
        <MapContainer ref="mapContainerRef" />
        <!-- 侧边栏 -->
        <div class="thinking-aside" :class="{ 'collapsed': isSidebarCollapsed }">
            <div class="thinking-aside-header">
                <h4 class="thinking-title">列表计划</h4>
                <p class="collapse-btn" @click="toggleSidebar"
                    style="margin-right: 10px; cursor: pointer; user-select: none;">
                    <<< </p>
            </div>
            <div class="thinking-aside-input">
                <el-input v-model="searchKeyword" placeholder="检索"
                    style="width: 380px;margin-right: 10px;height: 30px;">
                    <template #suffix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
            </div>
            <div class="thinking-aside-list" v-for="item in filteredList" :key="item.id"
                style="min-height: 230px;width: 370px;position: relative;">
                <h4 class="thinking-aside-list-title">{{ item.taskName }}</h4>
                <div class="thinking-aside-list-item" style="display: flex;gap: 20px;">
                    <p style="line-height: 30px; width: 100px;">地形:{{ item.terrainDisplay || item.terrain }}</p>
                    <p style="line-height: 30px; width: 100px;">气象:{{ weatherMap[item.weather] || item.weather }}</p>
                    <p style="line-height: 30px; width: 100px;">海况:{{ seaStateMap[item.seaState] || item.seaState }}</p>
                </div>
                <p style="line-height: 30px;margin-bottom: 10px;color: white;">时段:{{ item.startTime }} - {{ item.endTime
                    }}</p>
                <div class="thinking-aside-task-list-item">
                    <p style="color: white;">任务:</p>
                    <div class="thinking-aside-task-list-item-content">
                        <div class="task-type-box" v-for="(type, index) in item.typeList" :key="index">
                            {{ type }}
                        </div>
                    </div>
                </div>
                <div class="btn-group">
                    <el-button type="primary" @click="handlePublish(item.id)" :disabled="item.publishStatus != 0">{{
                        item.publishStatus == 0 ?
                            '发布' : '已发布' }}</el-button>
                    <el-button v-show="item.publishStatus != 0" type="primary" @click="startTask(item.id)" :disabled="item.dirllStatus == 3">
                        {{ item.dirllStatus == 1 ? '开始' : item.dirllStatus == 2 ? '暂停' : item.dirllStatus == 3 ? '结束' : '暂停'
                        }}
                    </el-button>
                    <el-button v-show="item.publishStatus == 1" type="primary" @click="getStatus">结束</el-button>
                </div>
            </div>
        </div>
        <!-- 展开按钮（仅在侧边栏隐藏时显示） -->
        <div v-if="isSidebarCollapsed" class="expand-btn" @click="toggleSidebar">
            展开
        </div>

        <!-- 左侧悬浮按钮组 -->
        <div class="left-floating-buttons">
            <div class="left-floating-btn" @click="openDialog(6)">
                按钮6
            </div>
            <div class="left-floating-btn" @click="openDialog(7)">
                按钮7
            </div>
            <div class="left-floating-btn" @click="openDialog(8)">
                按钮8
            </div>
        </div>

        <div class="thinking-main">

        </div>

        <!-- 右侧悬浮按钮组 -->
        <div class="floating-buttons">
            <div class="floating-btn" @click="openDialog(1)">
                按钮1
            </div>
            <div class="floating-btn" @click="openDialog(2)">
                按钮2
            </div>
            <div class="floating-btn" @click="openDialog(3)">
                按钮3
            </div>
            <div class="floating-btn" @click="openDialog(4)">
                按钮4
            </div>
            <div class="floating-btn" @click="openDialog(5)">
                按钮5
            </div>
            <div class="floating-btn" @click="openDialog(9)">
                按钮9
            </div>
        </div>

        <!-- 弹窗遮罩层和弹窗 -->
        <!-- 弹窗1 -->
        <div v-if="dialogVisible1" class="custom-dialog-overlay1" @click.self="closeDialog(1)">
            <div class="custom-dialog-1">
                <div class="dialog-header">
                    <h3 class="dialog-title">状态监控</h3>
                    <span class="dialog-close" @click="closeDialog(1)">×</span>
                </div>
                <div class="dialog-content">
                    <!-- 弹窗内容区域 -->
                    <div class="mock-data-title" style="border-bottom: 1px solid #5f5f5f;padding-bottom: 10px;">PZZKXT
                    </div>
                    <div class="mock-data" v-if="mockData?.['PZZKXT']">
                        <div class="mock-data-item" v-for="(value, key) in mockData['PZZKXT']" :key="key">
                            <span class="status-dot"
                                :class="value === true || value === 'true' ? 'status-dot-true' : 'status-dot-false'"></span>
                            {{ key }}：{{ value }}
                        </div>
                    </div>

                    <div class="mock-data-title"
                        style="border-bottom: 1px solid #5f5f5f;padding-bottom: 10px;margin-top: 20px;">PZZKXT</div>
                    <div class="mock-data" v-if="mockData?.['XSZDHJPZXT']">
                        <div class="mock-data-item" v-for="(value, key) in mockData['XSZDHJPZXT']" :key="key">
                            <span class="status-dot"
                                :class="value === true || value === 'true' ? 'status-dot-true' : 'status-dot-false'"></span>
                            {{ key }}：{{ value }}
                        </div>
                    </div>

                    <div class="mock-data-title"
                        style="border-bottom: 1px solid #5f5f5f;padding-bottom: 10px;margin-top: 20px;">PZZKXT</div>
                    <div class="mock-data" v-if="mockData?.['LQPZDPZXT']">
                        <div class="mock-data-item" v-for="(value, key) in mockData['LQPZDPZXT']" :key="key">
                            <span class="status-dot"
                                :class="value === true || value === 'true' ? 'status-dot-true' : 'status-dot-false'"></span>
                            {{ key }}：{{ value }}
                        </div>
                    </div>

                    <div class="mock-data-title"
                        style="border-bottom: 1px solid #5f5f5f;padding-bottom: 10px;margin-top: 20px;">PZZKXT</div>
                    <div class="mock-data" v-if="mockData?.['WRJMNXT']">
                        <div class="mock-data-item" v-for="(value, key) in mockData['WRJMNXT']" :key="key">
                            <span class="status-dot"
                                :class="value === true || value === 'true' ? 'status-dot-true' : 'status-dot-false'"></span>
                            {{ key }}：{{ value }}
                        </div>
                    </div>

                    <div class="mock-data-title"
                        style="border-bottom: 1px solid #5f5f5f;padding-bottom: 10px;margin-top: 20px;">PZZKXT</div>
                    <div class="mock-data" v-if="mockData?.['DMWRMNXT']">
                        <div class="mock-data-item" v-for="(value, key) in mockData['DMWRMNXT']" :key="key">
                            <span class="status-dot"
                                :class="value === true || value === 'true' ? 'status-dot-true' : 'status-dot-false'"></span>
                            {{ key }}：{{ value }}
                        </div>
                    </div>

                    <div class="mock-data-title"
                        style="border-bottom: 1px solid #5f5f5f;padding-bottom: 10px;margin-top: 20px;">PZZKXT</div>
                    <div class="mock-data" v-if="mockData?.['SYWRMNXT']">
                        <div class="mock-data-item" v-for="(value, key) in mockData['SYWRMNXT']" :key="key">
                            <span class="status-dot"
                                :class="value === true || value === 'true' ? 'status-dot-true' : 'status-dot-false'"></span>
                            {{ key }}：{{ value }}
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- 弹窗2 -->
        <div style="position: absolute; top: 50px;right: 40px;z-index: 2000;" v-if="dialogVisible2"
            @click.self="closeDialog(2)">
            <div class="custom-dialog-2">
                <div class="dialog-header">
                    <h3 class="dialog-title">数据监控</h3>
                    <span class="dialog-close" @click="closeDialog(2)">×</span>
                </div>
                <div class="dialog-content">
                    <!-- 弹窗内容区域 -->
                    <div style="width: 100%;height: 100%;display: flex;">
                        <div class="left" style="width: 50%;">
                            <h4 style="border-bottom: 2px solid #5f5f5f;padding-bottom: 10px;">模拟系统</h4>

                        </div>
                        <div class="right" style="width: 50%;">nihao</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 弹窗3 -->
        <div style="position: absolute; top: 50px;right: 40px;z-index: 2000;" v-if="dialogVisible3"
            @click.self="closeDialog(3)">
            <div class="custom-dialog-3">
                <div class="dialog-header">
                    <h3 class="dialog-title">零机干预</h3>
                    <span class="dialog-close" @click="closeDialog(3)">×</span>
                </div>
                <div class="dialog-content">
                    <!-- 弹窗内容区域 -->
                    <div style="width: 100%;height: 100%;border:1px solid #64c3ed ; display: flex;">
                        <div class="left" :class="{ 'selected': selectedSide === 'blue' }" @click="selectSide('blue')"
                            style="width: 50%;height: 4%;text-align: center;background-color: #162a6f;box-sizing: border-box;display: flex;align-items: center;justify-content: center;cursor: pointer;">
                            <p>蓝方</p>
                        </div>
                        <div class="right" :class="{ 'selected': selectedSide === 'red' }" @click="selectSide('red')"
                            style="width: 50%;height: 4%;text-align: center;color: white;background-color: #12225a;box-sizing: border-box;display: flex;align-items: center;justify-content: center;cursor: pointer;">
                            <p>红方</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 弹窗4 -->
        <div style="position: absolute; top: 50px;right: 40px;z-index: 2000;" v-if="dialogVisible4"
            @click.self="closeDialog(4)">
            <div class="custom-dialog-4">
                <div class="dialog-header">
                    <h3 class="dialog-title">TQ下发</h3>
                    <span class="dialog-close" @click="closeDialog(4)">×</span>
                </div>
                <div class="dialog-content">
                    <!-- 弹窗内容区域 -->
                    <div class="srj" style="display: flex;gap: 10px;">
                        <p>多xysrj</p>
                        <img src="/dist/images/layers.png" alt="" width="20px" height="20px">
                        <img src="/dist/images/layers.png" alt="" width="20px" height="20px">
                        <img src="/dist/images/layers.png" alt="" width="20px" height="20px">
                        <img src="/dist/images/layers.png" alt="" width="20px" height="20px">
                        <img src="/dist/images/layers.png" alt="" width="20px" height="20px">
                    </div>
                    <div class="srj" style="display: flex;gap: 10px;">
                        <p>多xysrj</p>
                        <img src="/dist/images/layers.png" @click="" alt="" width="20px" height="20px">
                        <img src="/dist/images/layers.png" @click="" alt="" width="20px" height="20px">
                        <img src="/dist/images/layers.png" @click="" alt="" width="20px" height="20px">
                        <img src="/dist/images/layers.png" @click="" alt="" width="20px" height="20px">
                        <img src="/dist/images/layers.png" @click="" alt="" width="20px" height="20px">
                    </div>
                    <div class="srj" style="display: flex;gap: 10px;">
                        <p>多xysrj</p>
                        <img src="/dist/images/layers.png" alt="" width="20px" height="20px">
                        <img src="/dist/images/layers.png" alt="" width="20px" height="20px">
                        <img src="/dist/images/layers.png" alt="" width="20px" height="20px">
                        <img src="/dist/images/layers.png" alt="" width="20px" height="20px">
                        <img src="/dist/images/layers.png" alt="" width="20px" height="20px">
                    </div>
                </div>
            </div>
        </div>

        <!-- 弹窗5 -->
        <div style="position: absolute; top: 50px;right: 40px;z-index: 2000;" v-if="dialogVisible5"
            @click.self="closeDialog(5)">
            <div class="custom-dialog-5">
                <div class="dialog-header">
                    <h3 class="dialog-title">任务列表</h3>
                    <span class="dialog-close" @click="closeDialog(5)">×</span>
                </div>
                <div class="dialog-content">
                    <el-table :data="flatTaskList" style="width: 100%" border>
                        <el-table-column prop="deviceName" label="装备名称" width="120" />
                        <el-table-column prop="longitude" label="经度" width="120">
                            <template #default="scope">
                                {{ scope.row.longitude != null && scope.row.longitude !== '' ?
                                    Number(scope.row.longitude).toFixed(6) : '' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="latitude" label="纬度" width="120">
                            <template #default="scope">
                                {{ scope.row.latitude != null && scope.row.latitude !== '' ?
                                    Number(scope.row.latitude).toFixed(6) : '' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="speed" label="速度" width="100">
                            <template #default="scope">
                                {{ scope.row.speed != null && scope.row.speed !== '' ?
                                    Number(scope.row.speed).toFixed(6) : '' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="pitch" label="俯仰" width="100">
                            <template #default="scope">
                                {{ scope.row.pitch != null && scope.row.pitch !== '' ?
                                    Number(scope.row.pitch).toFixed(6) : '' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="roll" label="滚转" width="100">
                            <template #default="scope">
                                {{ scope.row.roll != null && scope.row.roll !== '' ? Number(scope.row.roll).toFixed(6) :
                                    '' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="yaw" label="偏航" width="100">
                            <template #default="scope">
                                {{ scope.row.yaw != null && scope.row.yaw !== '' ? Number(scope.row.yaw).toFixed(6) : ''
                                }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="communicationStatus" label="通信" width="100">
                            <template #default="scope">
                                <span :style="{ color: scope.row.communicationStatus === 1 ? '#67c23a' : '#f56c6c' }">
                                    {{ scope.row.communicationStatus === 1 ? '正常' : '异常' }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="cameraStatus" label="相机" width="100">
                            <template #default="scope">
                                <span :style="{ color: scope.row.cameraStatus === 1 ? '#67c23a' : '#f56c6c' }">
                                    {{ scope.row.cameraStatus === 1 ? '正常' : '异常' }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="gimbalStatus" label="云台" width="100">
                            <template #default="scope">
                                <span :style="{ color: scope.row.gimbalStatus === 1 ? '#67c23a' : '#f56c6c' }">
                                    {{ scope.row.gimbalStatus === 1 ? '正常' : '异常' }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="equipmentStatus" label="发动机" width="100">
                            <template #default="scope">
                                <span :style="{ color: scope.row.equipmentStatus === 1 ? '#67c23a' : '#f56c6c' }">
                                    {{ scope.row.equipmentStatus === 1 ? '正常' : '异常' }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="servoStatus" label="舵机" width="100">
                            <template #default="scope">
                                <span :style="{ color: scope.row.servoStatus === 1 ? '#67c23a' : '#f56c6c' }">
                                    {{ scope.row.servoStatus === 1 ? '正常' : '异常' }}
                                </span>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
        </div>

        <!-- 弹窗6 -->
        <ImageDialog v-model:visible="dialogVisible6" :image-src="imageSrc6" title="图片展示6" />

        <!-- 弹窗7 -->
        <ImageDialog v-model:visible="dialogVisible7" :image-src="imageSrc7" title="图片展示7" />

        <!-- 弹窗8 -->
        <ImageDialog v-model:visible="dialogVisible8" :image-src="imageSrc8" title="图片展示8" />

        <!-- 鹰眼图 -->
        <EagleEye v-model:visible="eagleEyeVisible" :map-instance="mapContainerRef" />

        <!-- 右下角地图工具按钮组 -->
        <div class="map-tools">
            <div class="map-tool-btn" :class="{ 'active': isMeasuring }" @click="toggleMeasure"
                :title="isMeasuring ? '点击退出测量模式' : '点击开始测量距离'">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="5" cy="5" r="2"></circle>
                    <circle cx="19" cy="19" r="2"></circle>
                    <line x1="5" y1="5" x2="19" y2="19"></line>
                </svg>
                <span>测量</span>
            </div>
        </div>

        <!-- 测量模式提示 -->
        <div v-if="isMeasuring" class="measure-tip">
            <div class="measure-tip-content">
                <p>测量模式已开启</p>
                <p style="font-size: 12px; margin-top: 5px;">请在地图上点击两个点进行测量</p>
            </div>
        </div>
    </div>
</template>
<style scoped lang="scss">
// 主题色变量
$theme-bg-color: rgb(21, 26, 45);
$theme-text-color: rgb(101, 171, 223);
$theme-button-color: rgb(26, 49, 116);
$theme-border-color: rgb(82, 103, 156);
$theme-scrollbar-color: rgb(65, 126, 242);

.thinking-container {

    // 滚动条样式（适用于容器内所有滚动元素）
    * {
        &::-webkit-scrollbar {
            width: 5px;
            height: 8px;
            background: $theme-scrollbar-color;
        }

        &::-webkit-scrollbar-track {
            background: $theme-border-color;
        }

        &::-webkit-scrollbar-thumb {
            background: $theme-scrollbar-color;
            transition: background 0.3s ease;
        }
    }

    display: flex;
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden;
}

.thinking-aside {
    display: flex;
    width: 420px;
    height: 100%;
    flex-direction: column;
    background-color: $theme-bg-color;
    padding: 20px 15px 20px 25px;
    box-sizing: border-box;
    overflow-y: auto;
    transition: transform 0.5s ease-in-out, opacity 0.5s ease-in-out;
    transform: translateX(0);
    opacity: 1;
    position: relative;
    z-index: 10; // 侧边栏在地图上方

    &.collapsed {
        transform: translateX(-100%);
        opacity: 0;
        pointer-events: none;
        position: absolute;
        z-index: -1;
    }
}

.thinking-main {
    flex: 1;
    transition: margin-left 0.5s ease-in-out;
    position: relative;
    z-index: 10; // 主内容区在地图上方
    pointer-events: none; // 允许鼠标事件穿透到地图

    // 如果主内容区有子元素需要交互，需要单独设置
    >* {
        pointer-events: auto;
    }
}

.expand-btn {
    position: fixed;
    left: 0;
    top: 5%;
    transform: translateY(-50%);
    background-color: $theme-bg-color;
    color: $theme-text-color;
    padding: 10px 5px;
    cursor: pointer;
    user-select: none;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    z-index: 1001; // 展开按钮在最上层
    border-radius: 0 4px 4px 0;
    transition: all 0.5s ease-in-out;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.3);

}

.thinking-aside-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;

    .collapse-btn {
        transition: transform 0.3s ease-in-out;
        cursor: pointer;
        color: $theme-text-color;

        &:hover {
            transform: scale(1.1);
        }
    }
}

.thinking-title {
    color: $theme-text-color;
}

.thinking-aside-input {
    display: flex;
    margin-bottom: 10px;

    :deep(.el-input__wrapper) {
        background-color: rgb(21, 26, 45) !important;
    }
}

.thinking-aside-input-button {
    display: flex;
    margin-bottom: 10px;

    .el-button {
        height: 30px;
        width: 60px !important;
        border-radius: 0 !important;
        background-color: $theme-button-color !important;
        border-color: $theme-border-color !important;
    }
}

:deep(.el-input__wrapper) {
    border-radius: 0 !important;
}

.thinking-aside-list {
    padding: 10px;
    box-sizing: border-box;
    border: 1px solid rgb(57, 76, 117);
    border-radius: 2px;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.6);
    margin-bottom: 10px;

    .thinking-aside-list-title {
        color: white;
    }

    .thinking-aside-list-item {
        color: white;
    }
}

.thinking-aside-task-list-item {
    display: flex;
    margin-bottom: 10px;

    .thinking-aside-task-list-item-content {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;

        .task-type-box {
            color: white;
            background-color: rgb(25, 53, 91);
            border: 1px solid rgb(57, 76, 117);
            padding: 0 10px;
            border-radius: 2px;
            font-size: 12px;
        }
    }
}

.btn-group {
    position: absolute;
    left: 10px;
    bottom: 10px;

    .el-button {
        height: 30px;
        width: 78px !important;
        border-radius: 0 !important;
        background-color: $theme-button-color !important;
        border-color: $theme-border-color !important;
    }
}

:deep(.edit-dialog) {
    .el-dialog__body {
        padding: 0;
        height: 630px;
        margin: 0 !important;
    }
}

.dialog-content {
    height: 100%;
    box-sizing: border-box;
}

.dialog-title {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: bold;
}

.form-row {
    display: flex;
    gap: 20px;
    margin-bottom: 10px;
    align-items: flex-start;
}

.form-item {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;

    &.full-width {
        flex: 1 1 100%;
    }

    label {
        font-size: 14px;
        white-space: nowrap;
        flex-shrink: 0;
    }

    >div {
        flex: 1;
    }

    :deep(.el-input),
    :deep(.el-select) {
        width: 100%;
    }

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
        border-radius: 0 !important;
    }
}

.time-range {
    display: flex;
    align-items: center;
    width: 100%;
}

.equipment-container {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 10px;
    border: 1px solid #dcdfe6;
    min-height: 50px;
    border-radius: 4px;
}

.equipment-box {
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 2px;
    display: inline-block;
    font-size: 12px;
    background-color: #f5f7fa;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #eee;

    .el-button {
        border-radius: 0 !important;
    }
}

// 左侧悬浮按钮组
.left-floating-buttons {
    position: fixed;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 1000; // 悬浮按钮在地图上方
    padding: 10px 0;
}

.left-floating-btn {
    width: 20px;
    height: 80px;
    background-color: $theme-button-color;
    border: 1px solid $theme-border-color;
    color: $theme-text-color;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: 12px;
    transition: all 0.3s ease;
    border-radius: 0 4px 4px 0;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.3);

    &:hover {
        background-color: lighten($theme-button-color, 10%);
    }

    &:active {
        transform: translateX(2px);
    }
}

// 右侧悬浮按钮组
.floating-buttons {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 1000; // 悬浮按钮在地图上方
    padding: 10px 0;
}

.floating-btn {
    width: 20px;
    height: 80px;
    background-color: $theme-button-color;
    border: 1px solid $theme-border-color;
    color: $theme-text-color;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: 12px;
    transition: all 0.3s ease;
    border-radius: 4px 0 0 4px;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.3);



    &:active {
        transform: translateX(-2px);
    }
}

// 弹窗样式

.custom-dialog-1 {
    width: 800px;
    height: 800px;
    background-color: $theme-bg-color;
    border: 1px solid $theme-border-color;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease;
    overflow: hidden;
}

.custom-dialog-2 {

    width: 1450px;
    height: 800px;
    background-color: $theme-bg-color;
    border: 1px solid $theme-border-color;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease;
}

.custom-dialog-3 {
    width: 350px;
    height: 850px;
    background-color: $theme-bg-color;
    border: 1px solid $theme-border-color;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease;
}

.custom-dialog-4 {
    width: 410px;
    height: 850px;
    background-color: $theme-bg-color;
    border: 1px solid $theme-border-color;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease;
}

.custom-dialog-5 {
    width: 1400px;
    height: 800px;
    background-color: $theme-bg-color;
    border: 1px solid $theme-border-color;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease;
    overflow: hidden;
}

.dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid $theme-border-color;

    .dialog-title {
        margin: 0;
        color: $theme-text-color;
        font-size: 16px;
        font-weight: bold;
    }

    .dialog-close {
        color: $theme-text-color;
        font-size: 24px;
        cursor: pointer;
        line-height: 1;
        transition: color 0.3s ease;

    }
}

.dialog-content {
    padding: 20px;
    flex: 1;
    color: $theme-text-color;
    overflow-y: auto;
}

// 表格样式
:deep(.el-table) {
    background-color: $theme-bg-color;
    color: $theme-text-color;

    .el-table__header {
        background-color: rgb(26, 49, 116);

        th {
            background-color: rgb(26, 49, 116) !important;
            color: $theme-text-color !important;
            border-color: $theme-border-color !important;
        }
    }

    .el-table__body {
        tr {
            background-color: $theme-bg-color;

            &:hover {
                background-color: rgb(26, 49, 116) !important;
            }
        }

        td {
            background-color: $theme-bg-color !important;
            color: $theme-text-color !important;
            border-color: $theme-border-color !important;
        }
    }

    .el-table__border {
        border-color: $theme-border-color;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideIn {
    from {
        transform: translateY(-20px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.custom-dialog-overlay1 {
    position: absolute;
    top: 100px;
    right: 50px;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000; // 弹窗遮罩层在地图上方
}

.mock-data-title {
    color: $theme-text-color;
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
}

.mock-data {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    width: 100%;

    .mock-data-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: $theme-text-color;
    }
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;

    &.status-dot-true {
        background-color: #67c23a;
    }

    &.status-dot-false {
        background-color: #f56c6c;
    }
}

// 红方蓝方选中状态样式
.left.selected,
.right.selected {
    border-bottom: 2px solid #5777c5;
}

// 右下角地图工具按钮组
.map-tools {
    position: fixed;
    right: 20px;
    bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 1000;
}

.map-tool-btn {
    width: 60px;
    height: 60px;
    background-color: $theme-button-color;
    border: 1px solid $theme-border-color;
    color: $theme-text-color;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    gap: 4px;

    svg {
        width: 20px;
        height: 20px;
    }

    span {
        font-size: 12px;
    }

    &:hover {
        background-color: lighten($theme-button-color, 10%);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    &:active {
        transform: translateY(0);
    }

    &.active {
        background-color: #67c23a;
        border-color: #67c23a;

        &:hover {
            background-color: lighten(#67c23a, 10%);
        }
    }
}

// 测量模式提示
.measure-tip {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2000;
    pointer-events: none;
}

.measure-tip-content {
    background-color: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 15px 25px;
    border-radius: 8px;
    border: 2px solid #67c23a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    text-align: center;
    animation: fadeIn 0.3s ease;

    p {
        margin: 0;
        color: #67c23a;
        font-size: 14px;
        font-weight: bold;
    }
}
</style>
