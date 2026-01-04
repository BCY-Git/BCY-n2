<script setup>
import { ref, nextTick, onMounted } from 'vue'
import axios from 'axios'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

// L 对象从全局 window.L 获取
const L = window.L

const route = useRoute()
const sceneNameDialogVisible = ref(false)
const terrainDialogVisible = ref(false)
const mapDialogVisible = ref(false)
const newSceneName = ref('')
const selectedTerrain = ref(null)
const map = ref(null)
const selectedMarker = ref(null)
const selectedCoordinates = ref(null)

// 页面加载时自动开始流程
onMounted(() => {
    // 检查URL参数，如果有场景名和地形，则跳过前两步
    const { surroundingsName, terrain } = route.query
    if (surroundingsName && terrain) {
        newSceneName.value = surroundingsName
        selectedTerrain.value = Number(terrain)
        // 直接打开地图选点
        mapDialogVisible.value = true
        nextTick(() => {
            initMap()
        })
    } else {
        // 否则走完整流程
        openMapDialog()
    }
})

const openMapDialog = () => {
    newSceneName.value = ''
    selectedTerrain.value = null
    sceneNameDialogVisible.value = true
}

const confirmSceneName = () => {
    if (!newSceneName.value || !newSceneName.value.trim()) {
        ElMessage.warning('请先输入场景名称')
        return
    }
    sceneNameDialogVisible.value = false
    terrainDialogVisible.value = true
}

const closeSceneNameDialog = () => {
    sceneNameDialogVisible.value = false
    handleCancel()
}

const confirmTerrain = () => {
    if (!selectedTerrain.value) {
        ElMessage.warning('请先选择一个地形')
        return
    }
    terrainDialogVisible.value = false
    mapDialogVisible.value = true
    nextTick(() => {
        nextTick(() => {
            initMap()
        })
    })
}

const closeTerrainDialog = () => {
    terrainDialogVisible.value = false
    selectedTerrain.value = null
    handleCancel()
}

const initMap = () => {
    if (!window.L) {
        console.error('Leaflet 未加载')
        ElMessage.error('地图库加载失败')
        return
    }
    
    const mapContainer = document.getElementById('pick-map')
    if (!mapContainer) return

    if (map.value) {
        map.value.remove()
        map.value = null
    }

    setTimeout(() => {
        const container = document.getElementById('pick-map')
        if (!container) return

        map.value = L.map('pick-map', {
            center: [35.0, 105.0],
            zoom: 5,
            minZoom: 4,
            maxZoom: 18,
            maxBounds: [[18, 73], [54, 135]],
            zoomAnimation: false,
            fadeAnimation: false
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            subdomains: ['a', 'b', 'c']
        }).addTo(map.value)

        map.value.whenReady(() => {
            map.value.on('click', (e) => {
                const { lat, lng } = e.latlng
                if (lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135) {
                    if (selectedMarker.value) {
                        map.value.removeLayer(selectedMarker.value)
                    }
                    
                    let icon
                    try {
                        icon = L.icon({
                            iconUrl: '/dist/images/marker-icon.png',
                            iconRetinaUrl: '/dist/images/marker-icon-2x.png',
                            shadowUrl: '/dist/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                        })
                    } catch (e) {
                        icon = L.divIcon({
                            className: 'custom-marker',
                            html: '<div style="background-color: red; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        })
                    }

                    selectedMarker.value = L.marker([lat, lng], { icon })
                        .addTo(map.value)
                        .bindPopup(`经度: ${lng.toFixed(6)}<br>纬度: ${lat.toFixed(6)}`)
                        .openPopup()
                    
                    selectedCoordinates.value = {
                        lat: lat.toFixed(6),
                        lng: lng.toFixed(6)
                    }
                } else {
                    ElMessage.warning('请在中国/台湾岛范围内选择位置')
                }
            })
        })
    }, 100)
}

const confirmSelection = async () => {
    if (!selectedCoordinates.value) {
        ElMessage.warning('请先选择地图位置')
        return
    }

    try {
        const areaArray = [{
            "经度": selectedCoordinates.value.lng,
            "纬度": selectedCoordinates.value.lat
        }]
        const areaString = JSON.stringify(areaArray)

        const postData = {
            surroundingsName: newSceneName.value,
            terrain: String(selectedTerrain.value),
            area: areaString
        }

        const res = await axios.post('/api/surroundings/add', postData)
        console.log('提交成功:', res.data)
        ElMessage.success('提交成功')
        closeMapDialog()
        
        // 处理返回逻辑
        if (route.query.goback === '1') {
            if (window.history.length > 1) {
                window.history.go(-1)
            } else {
                window.close()
            }
        }
    } catch (error) {
        console.error('提交失败:', error)
        ElMessage.error('提交失败，请重试')
    }
}

const closeMapDialog = () => {
    mapDialogVisible.value = false
    if (map.value) {
        map.value.remove()
        map.value = null
    }
    selectedMarker.value = null
    selectedCoordinates.value = null
    // 这里不清除 selectedTerrain 和 newSceneName，因为可能是从外部传入的
    handleCancel()
}

const handleCancel = () => {
    if (route.query.goback === '1') {
        if (window.history.length > 1) {
            window.history.go(-1)
        } else {
            window.close()
        }
    }
}

</script>

<template>
    <div class="pick-container">
        <!-- 场景名称输入弹窗 -->
        <el-dialog v-model="sceneNameDialogVisible" title="输入场景名称" :width="500" :close-on-click-modal="false"
            align-center :show-close="false">
            <div>
                <el-input v-model="newSceneName" placeholder="请输入场景名称" />
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="closeSceneNameDialog">取消</el-button>
                    <el-button type="primary" @click="confirmSceneName">确定</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 地形选择弹窗 -->
        <el-dialog v-model="terrainDialogVisible" title="选择地形" :width="500" :close-on-click-modal="false"
            class="terrain-dialog" align-center :show-close="false">
            <div class="terrain-select">
                <el-radio-group v-model="selectedTerrain" size="large">
                    <el-radio :value="1"
                        style="margin-bottom: 20px;width: 435px; padding: 15px; border: 1px solid #dcdfe6; border-radius: 4px;">
                        <span style="font-size: 16px;">场景1</span>
                    </el-radio>
                    <el-radio :value="2"
                        style="margin-bottom: 20px; padding: 15px; border: 1px solid #dcdfe6; border-radius: 4px;">
                        <span style="font-size: 16px;">场景2</span>
                    </el-radio>
                    <el-radio :value="3" style=" padding: 15px; border: 1px solid #dcdfe6; border-radius: 4px;">
                        <span style="font-size: 16px;">场景3</span>
                    </el-radio>
                </el-radio-group>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="closeTerrainDialog">取消</el-button>
                    <el-button type="primary" @click="confirmTerrain">确定</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 地图选择弹窗 -->
        <el-dialog class="map-dialog-box" v-model="mapDialogVisible" title="选择地区" :width="900"
            :close-on-click-modal="false" @close="closeMapDialog" :show-close="false">
            <div id="pick-map" style="height: 600px; width: 100%;"></div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="closeMapDialog">取消</el-button>
                    <el-button type="primary" @click="confirmSelection">确定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<style lang="scss" scoped>
.pick-container {
    width: 100vw;
    height: 100vh;
    background-color: rgb(21, 26, 45);
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
}

:deep(.custom-marker) {
    background: transparent;
    border: none;
}

.terrain-select {
    padding: 20px 0;

    :deep(.el-radio) {
        width: 100%;
        margin-right: 0;

        .el-radio__label {
            width: 100%;
        }
    }

    :deep(.el-radio__input.is-checked .el-radio__inner) {
        background-color: #409eff;
        border-color: #409eff;
    }

    :deep(.el-radio__input.is-checked + .el-radio__label) {
        color: #409eff;
    }
}
</style>
