<script setup>
import axios from 'axios';
import { ref, computed, watch, nextTick } from 'vue';
import { terrainMap, typeMap, weatherMap, seaStateMap } from '@/utils/dict';
import { Search } from '@element-plus/icons-vue';

import { publishApi } from '@/api/publish';
const list = ref([]);
const searchKey = ref('');
import { ElMessage, ElMessageBox } from 'element-plus';
const dialogVisible = ref(false);
const currentEditItem = ref(null);
const isSidebarCollapsed = ref(false);
const isEditMode = computed(() => {
    if (!currentEditItem.value) return false;
    const id = currentEditItem.value.id;
    // 只有当 id 存在且不是空字符串时，才是编辑模式
    return id !== undefined && id !== null && id !== '';
});
const mapDialogVisible = ref(false);
const normalizeText = (text) => {
    if (!text) return '';


    return text
        .trim()
        .replace(/\r\n/g, '\n') // 统一换行符
        .replace(/\r/g, '\n')
        .replace(/[;,，；]/g, '\n') // 所有分隔符变换行
        .replace(/\n{2,}/g, '\n'); // 去掉多余空行
};

// 格式化JSON字符串为简洁的文本格式：序号.经纬度 经度，纬度（每行一个坐标）
const formatJsonWithLineBreaks = (jsonString) => {
    if (!jsonString) return '';

    try {
        // 尝试解析JSON
        const parsed = JSON.parse(jsonString);
        // 如果是数组，格式化为简洁文本
        if (Array.isArray(parsed)) {
            return parsed.map((item, index) => {
                const jingdu = item.经度 || item.longitude || '';
                const weidu = item.纬度 || item.latitude || '';
                return `${index + 1}.经纬度 ${jingdu} ${weidu}`;
            }).join('\n');
        }
        // 如果是单个对象
        if (typeof parsed === 'object' && parsed !== null) {
            const jingdu = parsed.经度 || parsed.longitude || '';
            const weidu = parsed.纬度 || parsed.latitude || '';
            return `1.经纬度 ${jingdu} ${weidu}`;
        }
        return jsonString;
    } catch (e) {
        // 如果不是有效的JSON，返回原字符串
        return jsonString;
    }
};
// getTaskList 方法已移至下方，与搜索功能一起实现

// 打开编辑弹窗
const openEditDialog = (item) => {
    // 创建深拷贝，避免修改时影响原列表
    currentEditItem.value = JSON.parse(JSON.stringify(item));
    dialogVisible.value = true;
};

// 关闭弹窗
const closeDialog = () => {
    dialogVisible.value = false;
    currentEditItem.value = null;
};

// 监听测试类型变化，自动更新测试力量
watch(() => currentEditItem.value?.typeArray, (newType) => {
    if (currentEditItem.value && newType && newType.length > 0) {
        currentEditItem.value.equipmentArray = [...newType];
    } else if (currentEditItem.value) {
        currentEditItem.value.equipmentArray = [];
    }
}, { deep: true });
// 测试力量显示列表（根据测试类型自动更新）
const selectedEquipmentList = computed(() => {
    if (!currentEditItem.value) return [];
    // 当测试类型改变时，自动更新测试力量为对应的类型
    if (currentEditItem.value.equipmentArray && currentEditItem.value.equipmentArray.length > 0) {
        return currentEditItem.value.equipmentArray.map(eq => ({
            label: typeMap[eq] || `设备${eq}`,
            value: eq
        }));
    }
    return [];
});

// 将文本格式转换为JSON格式
const parseTextToJson = (text) => {
    if (!text) return '';

    // 如果已经是JSON格式，直接返回
    try {
        JSON.parse(text);
        return text;
    } catch (e) {
        // 不是JSON格式，需要转换
    }
    // 按行分割
    const lines = text.split('\n').filter(line => line.trim());
    const result = [];

    lines.forEach(line => {
        // 匹配 "序号.经纬度 经度，纬度" 格式
        // 例如：1.经纬度 116.397428，39.90923
        const match = line.match(/\d+\.\s*经纬度\s+([^，,]+)[，,]\s*([^\s]+)/);

        if (match) {
            result.push({
                "经度": match[1].trim(),
                "纬度": match[2].trim()
            });
        } else {
            // 兼容旧格式 "经度：值 纬度：值"
            const jingduMatch = line.match(/经度[：:]\s*([^\s]+)/);
            const weiduMatch = line.match(/纬度[：:]\s*([^\s]+)/);

            if (jingduMatch && weiduMatch) {
                result.push({
                    "经度": jingduMatch[1],
                    "纬度": weiduMatch[1]
                });
            }
        }
    });

    return result.length > 0 ? JSON.stringify(result) : text;
};

// 格式化测试区域显示（简洁文本格式）
const formattedArea = computed({
    get: () => {
        if (!currentEditItem.value || !currentEditItem.value.area) return '';
        return formatJsonWithLineBreaks(currentEditItem.value.area);
    },
    set: (value) => {
        if (currentEditItem.value) {
            // 将用户输入的文本格式转换回JSON格式保存
            currentEditItem.value.area = parseTextToJson(value);
        }
    }
});
// 把前端的ISO格式时间(UTC) → 转成MySQL标准的北京时间(YYYY-MM-DD HH:mm:ss)
const formatIsoToMysqlTime = (isoTime) => {
    if (!isoTime) return ''; // 空值直接返回空
    const date = new Date(isoTime);
    const year = date.getFullYear();
    // 补0：月份是0开始，日期/时分秒小于10补0
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    // 拼接成MySQL能识别的标准格式
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// ============ 第二步：你的保存方法，只需要修改时间字段的处理逻辑 ============
const handleSave = async () => {
    try {
        if (!currentEditItem.value) return;
        const updateData = {
            ...currentEditItem.value,
            // 将数组格式转换回字符串格式
            type: currentEditItem.value.typeArray ? currentEditItem.value.typeArray.join(',') : '',
            equipment: currentEditItem.value.equipmentArray ? currentEditItem.value.equipmentArray.join(',') : '',
            // 处理 null 值
            weather: currentEditItem.value.weather || 'null',
            seaState: currentEditItem.value.seaState || 'null',
            area: currentEditItem.value.area || 'null',
            remasks: currentEditItem.value.remasks || 'null',
            // ============ 核心新增：精准处理时间格式【UTC→北京时间】 ============
            startTime: formatIsoToMysqlTime(currentEditItem.value.startTime),
            endTime: formatIsoToMysqlTime(currentEditItem.value.endTime),
            // 有其他时间字段，直接调用这个方法就行，比如 createTime、updateTime 等
        };
        // 移除不需要的字段
        delete updateData.terrainDisplay;
        delete updateData.typeList;
        delete updateData.typeArray;
        delete updateData.equipmentArray;
        // 区分新增和编辑
        if (isEditMode.value) {
            //  这里一定要加 await ，不然会导致异步问题
            await publishApi.updateTask(updateData);
        } else {
            const created = await publishApi.addTask(updateData);
            ElMessage.success('成功添加');
            getTaskList();
        }
        console.log('保存成功');
        ElMessage.success('保存成功');
        closeDialog();
        getTaskList(); // 刷新列表
    } catch (error) {
        console.error('保存失败:', error);
        ElMessage.error('保存失败');
    }
};

const handleDelete = async (id) => {
    ElMessageBox.confirm('确定删除吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        await axios.delete(`/api/task/${id}`);
        ElMessage.success('删除成功');
        getTaskList(); // 刷新列表
    });
}

const handleTop = (id) => {
    // 找到 item
    const index = list.value.findIndex(item => item.id === id);
    if (index === -1) return;

    const target = list.value[index];

    // 删除
    list.value.splice(index, 1);

    // 插入第一位
    list.value.unshift(target);

    ElMessage.success('置顶成功');
}

const handleAdd = () => {
    console.log('新增');
    // 初始化一个空的编辑对象，确保对话框内的控件样式与编辑模式一致
    currentEditItem.value = {
        id: '',
        taskName: '',
        taskPurpose: '',
        terrain: '',
        weather: '',
        seaState: '',
        area: '',
        typeArray: [],
        equipmentArray: [],
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        remasks: ''
    };
    dialogVisible.value = true;


}

// 测试模板选项
const templateOptions = [
    { label: '模板一', value: '1' },
    { label: '模板二', value: '2' }
];

// 选择模板时调用接口（预留位置）
const handleTemplateChange = async (templateValue) => {
    if (!templateValue) return;

    try {
        const res = await axios.get(`/api/template/task/${templateValue}`);

        // 获取数据，兼容 res.data.data 或 res.data
        const templateData = res.data.data || res.data;
        console.log('模板数据:', templateData);

        // 填充表单字段
        currentEditItem.value.taskName = templateData.taskName || '';
        currentEditItem.value.taskPurpose = templateData.taskPurpose || '';
        currentEditItem.value.terrain = templateData.terrain || '';
        currentEditItem.value.weather = templateData.weather || '';
        currentEditItem.value.seaState = templateData.seaState || '';
        currentEditItem.value.area = templateData.area || '';
        currentEditItem.value.remasks = templateData.remasks || '';

        // 处理 type 和 equipment，转换为数组格式（与 getTaskList 中的处理逻辑一致）
        if (templateData.type && templateData.type !== 'null') {
            currentEditItem.value.typeArray = typeof templateData.type === 'string'
                ? templateData.type.split(',').map(t => t.trim())
                : (Array.isArray(templateData.type) ? templateData.type : [templateData.type]);
        } else {
            currentEditItem.value.typeArray = [];
        }

        if (templateData.equipment && templateData.equipment !== 'null') {
            currentEditItem.value.equipmentArray = typeof templateData.equipment === 'string'
                ? templateData.equipment.split(',').map(e => e.trim())
                : (Array.isArray(templateData.equipment) ? templateData.equipment : [templateData.equipment]);
        } else {
            currentEditItem.value.equipmentArray = [];
        }
    } catch (error) {
        console.error('获取模板数据失败:', error);
        ElMessage.error('获取模板数据失败');
    }
}



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

const getTaskList = async () => {
    publishApi.getTaskList().then(res => {
        console.log("获取的列表", res.data);
        list.value = res.data;
        console.log(res.data);
        const raw = res.data;
        list.value = raw.map(item => {
            // 处理 type 和 equipment 转换为数组格式用于编辑
            const typeArray = item.type && item.type !== 'null'
                ? (typeof item.type === 'string' ? item.type.split(',').map(t => t.trim()) : [item.type])
                : [];
            const equipmentArray = item.equipment && item.equipment !== 'null'
                ? (typeof item.equipment === 'string' ? item.equipment.split(',').map(e => e.trim()) : [item.equipment])
                : [];
            return {
                ...item,
                terrainDisplay: terrainMap[item.terrain] || item.terrain, // 显示用的映射值
                typeList: getTypeList(item.type), // 将 type 转换为数组用于显示
                typeArray, // 用于编辑的数组格式
                equipmentArray // 用于编辑的数组格式
            };
        })
    })

    // 映射 terrain 和 type 用于显示，同时添加用于编辑的数组格式

}
getTaskList()

const searchTask = async () => {
    getTaskList()
    // const res = await axios.get(`/api/task/listNoPage?taskName=${searchKey.value}`)
    console.log(res)
    const raw = res.data.data || res.data
    // 映射 terrain 和 type 用于显示，同时添加用于编辑的数组格式
    list.value = raw.map(item => {
        // 处理 type 和 equipment 转换为数组格式用于编辑
        const typeArray = item.type && item.type !== 'null'
            ? (typeof item.type === 'string' ? item.type.split(',').map(t => t.trim()) : [item.type])
            : [];
        const equipmentArray = item.equipment && item.equipment !== 'null'
            ? (typeof item.equipment === 'string' ? item.equipment.split(',').map(e => e.trim()) : [item.equipment])
            : [];
        return {
            ...item,
            terrainDisplay: terrainMap[item.terrain] || item.terrain, // 显示用的映射值
            typeList: getTypeList(item.type), // 将 type 转换为数组用于显示
            typeArray, // 用于编辑的数组格式
            equipmentArray // 用于编辑的数组格式
        };
    })
    console.log("搜索数据", list.value)
}

// 切换侧边栏显示/隐藏
const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

// 初始化地图
const initMap = () => {
    if (!window.L) {
        console.error('Leaflet 未加载');
        ElMessage.error('地图库加载失败，请刷新页面重试');
        return;
    }

    const mapContainer = document.getElementById('task-map');
    if (!mapContainer) {
        console.error('地图容器不存在');
        return;
    }

    // 如果地图已存在，先移除
    if (mapInstance.value) {
        mapInstance.value.remove();
        mapInstance.value = null;
    }

    setTimeout(() => {
        const container = document.getElementById('task-map');
        if (!container) {
            console.error('地图容器不存在');
            return;
        }

        // 创建地图
        mapInstance.value = window.L.map('task-map', {
            center: [35.0, 105.0],
            zoom: 5,
            minZoom: 4,
            maxZoom: 18,
            maxBounds: [
                [18, 73],
                [54, 135]
            ],
            zoomAnimation: false,
            fadeAnimation: false
        });

        // 添加瓦片图层
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            subdomains: ['a', 'b', 'c']
        }).addTo(mapInstance.value);

        // 等待地图完全初始化
        mapInstance.value.whenReady(() => {
            // 只有选择了场景后才允许点击地图选择位置
            if (!showSceneSelection.value) {
                enableMapClick();
            }
        });
    }, 100);
}

// 选择场景
const selectScene = (sceneId) => {
    selectedTerrain.value = sceneId;
    showSceneSelection.value = false; // 隐藏场景选择图片
    // 启用地图点击功能
    enableMapClick();
}

// 启用地图点击选择位置
const enableMapClick = () => {
    if (!mapInstance.value) return;

    mapInstance.value.off('click'); // 先移除之前的点击事件
    mapInstance.value.on('click', (e) => {
        const { lat, lng } = e.latlng;
        // 检查是否在中国范围内
        if (lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135) {
            // 移除之前的标记
            if (selectedMarker.value) {
                mapInstance.value.removeLayer(selectedMarker.value);
            }
            // 创建标记
            let icon;
            try {
                icon = window.L.icon({
                    iconUrl: '/dist/images/marker-icon.png',
                    iconRetinaUrl: '/dist/images/marker-icon-2x.png',
                    shadowUrl: '/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });
            } catch (e) {
                icon = window.L.divIcon({
                    className: 'custom-marker',
                    html: '<div style="background-color: red; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
            }
            selectedMarker.value = window.L.marker([lat, lng], { icon })
                .addTo(mapInstance.value)
                .bindPopup(`经度: ${lng.toFixed(6)}<br>纬度: ${lat.toFixed(6)}`)
                .openPopup();
            selectedCoordinates.value = {
                lat: lat.toFixed(6),
                lng: lng.toFixed(6)
            };
        } else {
            ElMessage.warning('请在中国范围内选择位置');
        }
    });
}

// 确认地图选择，打开表单对话框
const confirmMapSelection = () => {
    if (!selectedTerrain.value) {
        ElMessage.warning('请先选择一个场景');
        return;
    }
    if (!selectedCoordinates.value) {
        ElMessage.warning('请在地图上选择一个位置');
        return;
    }

    // 格式化区域数据
    const areaArray = [{
        "经度": selectedCoordinates.value.lng,
        "纬度": selectedCoordinates.value.lat
    }];
    const areaString = JSON.stringify(areaArray);

    // 关闭地图对话框
    closeMapDialog();

    // 打开表单对话框并填充数据
    currentEditItem.value = {
        id: undefined,
        taskName: '',
        taskPurpose: '',
        terrain: String(selectedTerrain.value),
        weather: '',
        seaState: '',
        isCreateByTemplate: '',
        area: areaString,
        typeArray: [],
        equipmentArray: []
    };
    dialogVisible.value = true;
}

// 关闭地图对话框
const closeMapDialog = () => {
    mapDialogVisible.value = false;
    if (mapInstance.value) {
        mapInstance.value.remove();
        mapInstance.value = null;
    }
    selectedMarker.value = null;
    selectedCoordinates.value = null;
    selectedTerrain.value = null;
    showSceneSelection.value = true;
}

</script>
<template>
    <div class="thinking-container">
        <div class="thinking-aside" :class="{ 'collapsed': isSidebarCollapsed }">
            <div class="thinking-aside-header">
                <h4 class="thinking-title">thinking列表</h4>
                <p class="collapse-btn" @click="toggleSidebar"
                    style="margin-right: 10px; cursor: pointer; user-select: none;">
                    <<< </p>
            </div>
            <div class="thinking-aside-input">
                <el-input v-model="searchKey" placeholder="检索" style="width: 226px;margin-right: 10px;height: 30px;"
                    @keyup.enter="searchTask">
                    <template #suffix>
                        <el-icon style="cursor: pointer;" @click="searchTask()">
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
                <div class="thinking-aside-input-button">
                    <el-button @click="handleAdd" type="primary">新增</el-button>
                    <el-button type="primary">导入</el-button>
                </div>
            </div>
            <div class="thinking-aside-list" v-for="item in list" :key="item.id"
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
                    <el-button type="primary" @click="handleTop(item.id)">置顶</el-button>
                    <el-button type="primary" @click="openEditDialog(item)">编辑</el-button>
                    <el-button type="primary" @click="handleDelete(item.id)">删除</el-button>
                    <el-button type="primary">导出</el-button>
                </div>
            </div>
        </div>
        <!-- 展开按钮（仅在侧边栏隐藏时显示） -->
        <div v-if="isSidebarCollapsed" class="expand-btn" @click="toggleSidebar">
            展开
        </div>
        <div class="thinking-main">
            <!-- 地图选择对话框 -->
            <el-dialog v-model="mapDialogVisible" title="选择场景和位置" :width="900" :close-on-click-modal="false"
                @close="closeMapDialog" class="map-dialog">
                <div class="map-container-wrapper">
                    <div id="task-map" class="task-map"></div>
                    <!-- 场景选择图片覆盖层（嵌入在地图上） -->
                    <div v-if="showSceneSelection" class="scene-selection-overlay">
                        <div class="scene-selection-title">请选择场景</div>
                        <div class="scene-items">
                            <div class="scene-item" @click="selectScene(1)">
                                <div class="scene-image">场景1</div>
                                <div class="scene-label">场景一</div>
                            </div>
                            <div class="scene-item" @click="selectScene(2)">
                                <div class="scene-image">场景2</div>
                                <div class="scene-label">场景二</div>
                            </div>
                            <div class="scene-item" @click="selectScene(3)">
                                <div class="scene-image">场景3</div>
                                <div class="scene-label">场景三</div>
                            </div>
                        </div>
                    </div>
                </div>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="closeMapDialog">取消</el-button>
                        <el-button type="primary" @click="confirmMapSelection">确定</el-button>
                    </div>
                </template>
            </el-dialog>

            <!-- 自定义对话框 -->
            <div v-if="dialogVisible" class="custom-dialog-overlay">
                <div class="custom-dialog">
                    <div class="dialog-content">
                        <h2 class="dialog-title">测试详情</h2>
                        <!-- 第一行：测试模板、测试名称、测试目的 -->
                        <div class="form-row">
                            <div class="form-item">
                                <label>*测试模板:</label>
                                <el-select v-model="currentEditItem.templateId" placeholder="请选择" :disabled="isEditMode"
                                    @change="handleTemplateChange" v-if="currentEditItem">
                                    <el-option v-for="option in templateOptions" :key="option.value"
                                        :label="option.label" :value="option.value" />
                                </el-select>
                            </div>
                            <div class="form-item">
                                <label>*测试名称:</label>
                                <el-input v-model="currentEditItem.taskName" placeholder="请输入测试名称"
                                    v-if="currentEditItem" />
                            </div>
                            <div class="form-item">
                                <label>*测试目的:</label>
                                <el-input v-model="currentEditItem.taskPurpose" placeholder="请输入测试目的"
                                    v-if="currentEditItem" />
                            </div>
                        </div>

                        <!-- 第二行：测试地形、测试环境、测试等级 -->
                        <div class="form-row">
                            <div class="form-item">
                                <label style="margin-left: 7px;">测试地形:</label>
                                <el-input v-model="currentEditItem.terrain" placeholder="请输入测试地形"
                                    v-if="currentEditItem" />
                            </div>
                            <div class="form-item">
                                <label style="margin-left: 6px;">测试环境:</label>
                                <el-input v-model="currentEditItem.weather" placeholder="请输入测试环境"
                                    v-if="currentEditItem" />
                            </div>
                            <div class="form-item">
                                <label style="margin-left: 6px;">测试等级:</label>
                                <el-input v-model="currentEditItem.seaState" placeholder="请输入测试等级"
                                    v-if="currentEditItem" />
                            </div>
                        </div>

                        <!-- 第三行：测试时段 -->
                        <div class="form-row">
                            <div class="form-item">
                                <label>*测试时段:</label>
                                <div class="time-range">
                                    <el-date-picker v-model="currentEditItem.startTime" type="datetime"
                                        placeholder="开始时间" format="YYYY-MM-DD HH:mm:ss"
                                        value-format="YYYY-MM-DD HH:mm:ss" style="flex: 1;" v-if="currentEditItem" />
                                    <span style="margin: 0 10px;">-</span>
                                    <el-date-picker v-model="currentEditItem.endTime" type="datetime" placeholder="结束时间"
                                        format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" style="flex: 1;"
                                        v-if="currentEditItem" />
                                </div>
                            </div>
                        </div>

                        <!-- 第四行：测试区域 -->
                        <div class="form-row">
                            <div class="form-item full-width">
                                <label>测试区域:</label>
                                <el-input class="textarea-input" v-model="formattedArea" type="textarea" :rows="4"
                                    placeholder="请输入测试区域" :autosize="{ minRows: 4, maxRows: 10 }"
                                    v-if="currentEditItem" />
                            </div>
                        </div>

                        <!-- 第五行：测试类型 -->
                        <div class="form-row">
                            <div class="form-item">
                                <label style="margin-left: 7px;">测试类型:</label>
                                <el-select v-model="currentEditItem.typeArray" multiple placeholder="请选择测试类型"
                                    class="type-select" style="width: 100%;" v-if="currentEditItem">
                                    <el-option v-for="(label, value) in typeMap" :key="value" :label="label"
                                        :value="value" />
                                </el-select>
                            </div>
                        </div>

                        <!-- 第六行：测试力量 -->
                        <div class="form-row">
                            <div class="form-item ">
                                <label style="margin-left: 7px;">测试力量:</label>
                                <div class="equipment-container">
                                    <div class="equipment-box" v-for="(eq, index) in selectedEquipmentList"
                                        :key="index">
                                        {{ eq.label }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 第七行：备注 -->
                        <div class="form-row">
                            <div class="form-item full-width">
                                <label>备注:</label>
                                <el-input class="textarea-input" v-model="currentEditItem.remasks" type="textarea"
                                    :rows="4" placeholder="请输入备注" v-if="currentEditItem" />
                            </div>
                        </div>

                        <!-- 按钮 -->
                        <div class="dialog-footer">
                            <el-button @click="closeDialog">取消</el-button>
                            <el-button type="primary" @click="handleSave">保存</el-button>
                        </div>
                    </div>
                </div>
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
    background-color: $theme-text-color;

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
            background: $theme-scrollbar-color; //滚动条颜色
            transition: background 0.3s ease;

        }
    }

    display: flex;
    width: 100%;
    height: 100vh;
    position: absolute;
    bottom: 0;
    /* 靠底 */
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

.task-type-box {
    padding: 0 4px;
    border: 1px solid #ccc;
    border-radius: 2px;
    display: inline-block;
    font-size: 12px;
    background-color: #fff;
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

// 自定义对话框样式
.custom-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    animation: fadeIn 0.3s ease;
}

.custom-dialog {
    width: 840px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease;
    overflow: hidden;
}

.dialog-content {
    padding: 30px;
    height: 630px;
    box-sizing: border-box;
    background-color: $theme-bg-color;

    * {
        color: white;
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

.dialog-title {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: bold;
    color: $theme-text-color;
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
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-left: 7px;
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

    .textarea-input {
        :deep(.el-textarea__inner) {
            background-color: $theme-bg-color !important;
            border-color: $theme-border-color !important;
            box-shadow: 0 0 0 1px $theme-border-color inset !important;
        }
    }

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
        border-radius: 0 !important;
        background-color: $theme-bg-color !important;
        //输入框背景颜色
        //输入框边框颜色
        //输入框阴影颜色
        border-color: $theme-border-color !important;
        box-shadow: 0 0 0 1px $theme-border-color inset !important;

        &:hover {
            border-color: $theme-border-color !important;
            box-shadow: 0 0 0 1px $theme-border-color inset !important;
        }

        &.is-focus {
            border-color: $theme-border-color !important;
            box-shadow: 0 0 0 1px $theme-border-color inset !important;
        }
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
    border: 1px solid $theme-border-color;
    min-height: 30px;
    border-radius: 4px;
    align-items: center;
    box-sizing: border-box;
}

.equipment-box {
    border: 1px solid $theme-border-color;
    border-radius: 2px;
    display: inline-block;
    font-size: 12px;
    background-color: rgb(28, 69, 146);
    align-items: center;
    padding: 2px 4px;
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
        background-color: $theme-button-color !important;
        border-color: $theme-border-color !important;
    }
}

// 全局输入框样式（用于对话框内的输入框）
:deep(.el-input__wrapper) {
    background-color: $theme-bg-color !important;
    border-color: $theme-border-color !important;
    border-radius: 0 !important;
    box-shadow: 0 0 0 1px $theme-border-color inset !important;

    &:hover {
        border-color: $theme-border-color !important;
        box-shadow: 0 0 0 1px $theme-border-color inset !important;
    }

    &.is-focus {
        border-color: $theme-border-color !important;
        box-shadow: 0 0 0 1px $theme-border-color inset !important;
    }
}


// 全局标签样式
.el-tag {
    background-color: $theme-button-color !important;
    border-color: $theme-border-color !important;
    color: $theme-text-color !important;
}

// 对话框内下拉框标签样式（仅针对测试类型下拉框）
.dialog-content {

    // 只针对测试类型下拉框的标签样式
    .type-select {

        :deep(.el-select__selected-item),
        :deep(.el-select__tags .el-tag),
        :deep(.el-select .el-tag) {
            border: 1px solid $theme-border-color !important;
            border-radius: 2px !important;
            font-size: 12px !important;
            background-color: rgb(28, 69, 146) !important;
            color: white !important;
            padding: 2px 4px !important;
            margin: 0 5px 0 0 !important;
            height: auto !important;
            line-height: normal !important;
            box-shadow: none !important;
            display: inline-flex !important;
            align-items: center !important;
        }

        // 标签关闭按钮样式
        :deep(.el-select__selected-item .el-icon),
        :deep(.el-tag .el-tag__close),
        :deep(.el-select__tags .el-icon),
        :deep(.el-select__tags .el-select__selected-item .el-icon) {
            color: white !important;
            font-size: 12px !important;

            &:hover {
                background-color: rgba(255, 255, 255, 0.2) !important;
                color: white !important;
            }
        }
    }
}

// 地图对话框样式
.map-dialog {
    :deep(.el-dialog__body) {
        padding: 0;
    }
}

.map-container-wrapper {
    position: relative;
    width: 100%;
    height: 600px;
}

.task-map {
    width: 100%;
    height: 100%;
    border-radius: 4px;
    border: 1px solid $theme-border-color;
}

// 场景选择覆盖层（嵌入在地图上）
.scene-selection-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(21, 26, 45, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    border-radius: 4px;
    pointer-events: auto;
    backdrop-filter: blur(2px);
}

.scene-selection-title {
    color: $theme-text-color;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 40px;
}

.scene-items {
    display: flex;
    gap: 40px;
    justify-content: center;
    align-items: center;
}

.scene-item {
    cursor: pointer;
    transition: transform 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;

    &:hover {
        transform: scale(1.1);
    }
}

.scene-image {
    width: 150px;
    height: 150px;
    background-color: $theme-button-color;
    border: 2px solid $theme-border-color;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    margin-bottom: 15px;
    transition: all 0.3s ease;

    &:hover {
        background-color: lighten($theme-button-color, 10%);
        border-color: lighten($theme-border-color, 10%);
    }
}

.scene-label {
    color: white;
    font-size: 16px;
    text-align: center;
}

:deep(.custom-marker) {
    background: transparent;
    border: none;
}
</style>
