<template>
  <div class="annotator">
    <div class="sidebar">
      <div class="date-group" v-for="group in groups" :key="group.date">
        <div class="date-title">{{ group.date }}</div>
        <el-scrollbar class="file-list">
          <div class="file-item" v-for="f in group.files" :key="f.name" :class="{ active: isActive(group.date, f.name) }" @click="select(group.date, f.name)">
            <span class="dot" :class="{ ok: f.ok }"></span>
            <span class="name">{{ f.name }}</span>
          </div>
        </el-scrollbar>
      </div>
    </div>
    <div class="main">
      <div class="toolbar">
        <el-button text @click="prev"><el-icon><ArrowLeft /></el-icon></el-button>
        <el-button text @click="next"><el-icon><ArrowRight /></el-icon></el-button>
        <el-button text><el-icon><Plus /></el-icon></el-button>
        <el-button text><el-icon><Star /></el-icon></el-button>
        <el-button text><el-icon><View /></el-icon></el-button>
        <el-button text><el-icon><QuestionFilled /></el-icon></el-button>
      </div>
      <div class="viewer">
        <img :src="currentImage" class="preview" />
      </div>
    </div>
    <div class="right">
      <el-card class="info-card" shadow="never">
        <div class="info-header">
          <span>图片信息</span>
          <el-button type="primary" size="small">导入抓拍参数</el-button>
        </div>
        <div class="info-body">暂无图片数据</div>
      </el-card>
      <el-card class="table-card" shadow="never">
        <div class="table-title">库物体</div>
        <el-table :data="objects" size="small" height="360">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="name" label="名称" width="140" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="damage" label="损伤" width="120" />
          <el-table-column label="修改" width="80">
            <template #default="scope">
              <el-button text @click="edit(scope.row)"><el-icon><Edit /></el-icon></el-button>
            </template>
          </el-table-column>
          <el-table-column label="删除" width="80">
            <template #default="scope">
              <el-button text type="danger" @click="remove(scope.$index)"><el-icon><Delete /></el-icon></el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowLeft, ArrowRight, Plus, Star, View, QuestionFilled, Edit, Delete } from '@element-plus/icons-vue'

const groups = ref([
  { date: '2025-10-15', files: [
    { name: 'DJI_0038.jpg', ok: true },
    { name: 'DJI_0037.jpg', ok: true },
    { name: 'DJI_0036.jpg', ok: true },
    { name: 'DJI_0035.jpg', ok: true },
    { name: 'DJI_0034.jpg', ok: true },
    { name: 'DJI_0033.jpg', ok: true },
    { name: 'DJI_0032.jpg', ok: true },
    { name: 'DJI_0031.jpg', ok: true }
  ]},
  { date: '2025-10-14', files: [
    { name: 'DJI_0029.jpg', ok: true },
    { name: 'DJI_0028.jpg', ok: true },
    { name: 'DJI_0027.jpg', ok: true },
    { name: 'DJI_0026.jpg', ok: true },
    { name: 'DJI_0025.jpg', ok: true }
  ]}
])

const current = ref({ date: groups.value[0].date, name: groups.value[0].files[0].name })
const isActive = (d, n) => current.value.date === d && current.value.name === n
const select = (d, n) => current.value = { date: d, name: n }

const flatFiles = computed(() => groups.value.flatMap(g => g.files.map(f => ({ date: g.date, name: f.name }))))
const idx = computed(() => flatFiles.value.findIndex(f => f.date === current.value.date && f.name === current.value.name))
const prev = () => { const i = idx.value; if (i > 0) current.value = flatFiles.value[i - 1] }
const next = () => { const i = idx.value; if (i < flatFiles.value.length - 1) current.value = flatFiles.value[i + 1] }

const currentImage = computed(() => `https://via.placeholder.com/900x500?text=${encodeURIComponent(current.value.name)}`)

const objects = ref([
  { name: '目标A', type: '类型1', damage: '轻微' },
  { name: '目标B', type: '类型2', damage: '一般' },
  { name: '目标C', type: '类型1', damage: '严重' },
  { name: '目标D', type: '类型3', damage: '轻微' },
  { name: '目标E', type: '类型2', damage: '一般' },
  { name: '目标F', type: '类型1', damage: '严重' },
  { name: '目标G', type: '类型3', damage: '轻微' },
  { name: '目标H', type: '类型2', damage: '一般' },
  { name: '目标I', type: '类型1', damage: '严重' },
  { name: '轨迹', type: '类型X', damage: '无' }
])

const edit = (row) => {}
const remove = (i) => objects.value.splice(i, 1)
</script>

<style scoped lang="scss">
.annotator {
  display: grid;
  grid-template-columns: 260px 1fr 420px;
  grid-template-rows: auto;
  gap: 8px;
  height: 100vh;
  padding: 8px;
  box-sizing: border-box;

  .sidebar {
    background: #0f2a3a;
    color: #cfe6f7;
    overflow: auto;
    padding: 8px;

    .date-title { font-weight: 600; margin: 8px 0; }
    .file-list { max-height: 300px; }

    .file-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      cursor: pointer;
      border-radius: 4px;

      &.active { background: rgba(255,255,255,0.1); }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #888;
        &.ok { background: #3ec46d; }
      }
      .name { color: #eaf6ff; font-size: 13px; }
    }
  }

  .main {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #f8fafc;
    }

    .viewer {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1f2937;
      margin-top: 8px;
      border-radius: 6px;

      .preview { max-width: 100%; max-height: 100%; object-fit: contain; }
    }
  }

  .right {
    display: flex;
    flex-direction: column;
    gap: 8px;
    :deep(.table-card){
      border-radius: 0!important;
    }

    .info-card {
      height: 180px;

      .info-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .info-body { color: #666; font-size: 13px; }
    }

    .table-card { flex: 1; }
  }
}
</style>
