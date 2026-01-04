<script setup>
import { ref, nextTick } from 'vue'
import axios from 'axios'
import { Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const Date = ref([])
const serchKey = ref('')
const sceneNameDialogVisible = ref(false)
const terrainDialogVisible = ref(false)
const newSceneName = ref('')
const selectedTerrain = ref(null)

const serch = async () => {
    const res = await axios.get(`/api/surroundings/listNoPage?surroundingsName=${serchKey.value}`)
    console.log(res)
    Date.value = res.data || res.data.data
    console.log("模拟数据", Date.value)
}

const getSurroundingsList = async () => {
    const res = await axios.get('/api/surroundings/listNoPage')
    console.log(res)
    Date.value = res.data.data || res.data || []
    console.log("这是接受的模拟数据", Date.value)
}
getSurroundingsList()

const updateSurroundings = async (id) => {
    const res = await axios.delete(`/api/surroundings/listNoPage/${id}`)
    console.log(res)
    getSurroundingsList()
}

// 流程控制：
// 1. 点击新增 -> openMapDialog -> 弹出场景名称输入框
const openMapDialog = () => {
    newSceneName.value = ''
    selectedTerrain.value = null
    sceneNameDialogVisible.value = true
}

// 2. 确认场景名称 -> confirmSceneName -> 弹出地形选择框
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
}

// 3. 确认地形 -> confirmTerrain -> 跳转到地图选点页面
const confirmTerrain = () => {
    if (!selectedTerrain.value) {
        ElMessage.warning('请先选择一个地形')
        return
    }
    terrainDialogVisible.value = false
    
    // 跳转到 Pick 页面，带上参数
    // router.push({
    //     path: '/surroundings/pick',
    //     query: {
    //         surroundingsName: newSceneName.value,
    //         terrain: String(selectedTerrain.value),
    //         goback: '1'
    //     }
    // })
}

const closeTerrainDialog = () => {
    terrainDialogVisible.value = false
    selectedTerrain.value = null
}

const selectSurroundings = (id) => {
    console.log('select', id)
}

const excludeSurroundings = (id) => {
    updateSurroundings(id)
}
</script>

<template>
    <div class="main">
        <div class="surrounding">
            <h3 class="scene-title">场景管理</h3>
            <div class="serch">
                <div class="serchInput">
                    <el-input placeholder="请输入场景名称" v-model="serchKey">
                        <template #suffix>
                            <el-icon>
                                <Search />
                            </el-icon>
                        </template>
                    </el-input>
                </div>
                <el-button type="primary" @click="serch" style="color: white!important;">搜索</el-button>
                <el-button type="primary" @click="openMapDialog()" style="color: white!important;">新增</el-button>
            </div>
            <div class="table">
                <el-table class="table-box" :data="Date" border style="width: 100%;margin-top: 20px;">
                    <el-table-column prop="id" width="120" label="序号" />
                    <el-table-column prop="surroundingsName" width="150" label="场景名称" />
                    <el-table-column prop="isTemplateData" width="150" label="地形" />
                    <el-table-column prop="terrain" label="气象" />
                    <el-table-column prop="weather" label="海况" />
                    <el-table-column prop="seaState" label="流向" />
                    <el-table-column prop="id" width="190" label="操作">
                        <template #default="scope">
                            <el-icon @click="selectSurroundings(scope.row.id)" size="20" color="aqua">
                                <Position />
                            </el-icon>
                            <el-icon @click="excludeSurroundings(scope.row.id)" size="20" color="red"
                                style="margin-left: 20px;">
                                <Delete />
                            </el-icon>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>

        <!-- 场景名称输入弹窗 -->
        <el-dialog v-model="sceneNameDialogVisible" title="输入场景名称" :width="500" :close-on-click-modal="false"
            align-center>
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
            class="terrain-dialog" align-center>
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
    </div>
</template>


<style lang="scss" scoped>
$theme-bg-color: rgb(21, 26, 45);
$theme-text-color: rgb(101, 171, 223);
$theme-button-color: rgb(26, 49, 116);
$theme-border-color: rgb(82, 103, 156);
$theme-scrollbar-color: rgb(65, 126, 242);

.main {
    display: flex;
    justify-self: center;
    align-items: center;
    height: 100vh;
}

.surrounding {
    height: 600px;
    width: 1000px;
    background-color: $theme-bg-color;
    padding: 20px 30px;
    box-sizing: border-box;

    .scene-title {
        color: $theme-text-color !important;
        margin-bottom: 20px;
    }

    .serch {
        display: flex;
        align-items: center;

        .serchInput {
            width: 300px;

            :deep(.el-input__wrapper) {
                border-radius: 0 !important;
                background-color: $theme-bg-color !important;
                border-color: $theme-border-color !important;
                box-shadow: 0 0 0 1px $theme-border-color inset !important;
            }
        }

        :deep(.el-button) {
            height: 30px !important;
            width: 60px !important;
            margin-left: 20px;
            border-radius: 0 !important;
            background-color: $theme-button-color !important;
            color: $theme-text-color !important;

            &:hover {
                background-color: $theme-button-color !important;
            }
        }
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
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

// 全局表格样式（因为某些 el-table 元素可能渲染在 scoped 外）
<style lang="scss">
// 主题色变量
$theme-bg-color: rgb(21, 26, 45);
$theme-text-color: rgb(101, 171, 223);
$theme-border-color: rgb(82, 103, 156);

// 确保表格样式全局生效
.table-box {
    background-color: $theme-bg-color !important;
    border: 1px solid $theme-border-color !important;

    // 覆盖 el-table border 属性生成的外边框，隐藏默认的边框线
    &.el-table--border {
        border: 1px solid $theme-border-color !important;

        // 隐藏 Element Plus 默认生成的边框线（伪元素）
        &::before,
        &::after {
            display: none !important;
        }

        // 隐藏内部包装器的边框
        .el-table__inner-wrapper {
            background-color: $theme-bg-color !important;
            border: none !important;

            &::before,
            &::after {
                display: none !important;
            }
        }
    }

    .el-table__inner-wrapper {
        background-color: $theme-bg-color !important;
        border: none !important;
    }

    .el-table__header-wrapper {
        background-color: $theme-bg-color !important;
        position: relative;

        // 表头左右边框
        &::after {
            content: '';
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 1px;
            background-color: $theme-border-color !important;
        }

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 1px;
            background-color: $theme-border-color !important;
            z-index: 1;
        }

        .el-table__header {
            background-color: $theme-bg-color !important;

            th {
                background-color: $theme-bg-color !important;
                color: $theme-text-color !important;
                border-color: $theme-border-color !important;
                border-left: none !important;
                border-right: none !important;
                border-top: none !important;
                border-bottom: 1px solid $theme-border-color !important;
                text-align: left !important;
                padding: 0 !important;

                .cell {
                    text-align: left !important;
                    padding: 12px !important;
                    line-height: 1.5;
                    display: block;
                }

                &:first-child {
                    border-left: none !important;
                }

                &:last-child {
                    border-right: none !important;
                }
            }

            // 表头第一行的上边框
            tr:first-child th {
                border-top: 1px solid $theme-border-color !important;
            }
        }
    }

    .el-table__body-wrapper {
        background-color: $theme-bg-color !important;
        position: relative;

        // 表体左右边框
        &::after {
            content: '';
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 1px;
            background-color: $theme-border-color !important;
        }

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 1px;
            background-color: $theme-border-color !important;
            z-index: 1;
        }

        .el-table__body {
            background-color: $theme-bg-color !important;

            tbody {
                background-color: $theme-bg-color !important;
            }

            tr {
                background-color: $theme-bg-color !important;
                color: white !important;

                &:hover {
                    background-color: rgba(255, 255, 255, 0.05) !important;
                }

                td {
                    background-color: $theme-bg-color !important;
                    color: white !important;
                    border-color: $theme-border-color !important;
                    border-left: none !important;
                    border-right: none !important;
                    border-top: none !important;
                    text-align: left !important;
                    padding: 0 !important;
                    vertical-align: middle !important;

                    .cell {
                        text-align: left !important;
                        padding: 12px !important;
                        line-height: 1.5;
                        display: block;
                    }

                    &:first-child {
                        border-left: none !important;
                    }

                    &:last-child {
                        border-right: none !important;
                    }
                }

                &:last-child td {
                    border-bottom: 1px solid $theme-border-color !important;
                }
            }
        }
    }
}
</style>
