<template>
  <div class="banner">
    nihao
  </div>
  <div class="container">
    <div class="asider">

    </div>
    <div class="main">
      <!-- 原始页面 -->
      <!-- <div v-if="!showScenePage">
        <div class="main-box">
          <h2 style="margin-bottom: 10px;">标题详情</h2>
          <div class="input-group">
            <p>*你好模板</p> <select class="select-input">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
            <p>*你好名称</p> <input type="text" />
            <p>*你好目的</p> <input type="text" />
          </div>
        </div>
        <div class="main-box">
          <div class="input-group">
            <p>*你好地形</p> <select class="select-input">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
            <p>*你好环境</p> <input type="text" />
            <p>*你好等级</p> <input type="text" />
          </div>
        </div>
        <div class="main-box">
          <div class="input-group">
            <p>*你好时段</p>
            <select class="select-input">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
            <select class="select-input">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>

          </div>
        </div>
        <div class="main-box">
          <div class="input-group-textarea">
            <p>*你好区域:</p>
            <textarea class="textarea-input1" rows="6"></textarea>
          </div>
        </div>

        <div class="main-box">
          <div class="input-group">
            <p>*任务类型</p>
            <select class="select-input">
              <option value="1">大事发生</option>
              <option value="2">范德萨发生的</option>
              <option value="3">大大是</option>
            </select>
          </div>
        </div>
        <div class="main-box">
          <div class="input-group">
            <p>*你好力量</p>
            <select class="select-input">
              <option value="1">大事发生</option>
              <option value="2">范德萨发生的</option>
              <option value="3">大大是</option>
            </select>
          </div>
        </div>
        <div class="main-box">
          <div class="input-group-textarea">
            <p>*备注</p>
            <textarea class="textarea-input2" rows="6"></textarea>
          </div>
        </div>
        <div class="button-group">
          <el-button type="primary">测试-1</el-button>
          <el-button type="primary" @click="showScenePage = true">点击切换</el-button>
        </div>
      </div> -->

      <!-- 场景管理页面 -->
      <!-- <div v-if="showScenePage" class="scene-page">
        <div class="scene-header">
          <h2>场景管理</h2>
        </div>
        <div class="scene-search">
          <el-input v-model="searchText" placeholder="搜索" style="flex: 1; max-width: 300px;"></el-input>
          <el-button type="primary">新增</el-button>
        </div>
        <div class="scene-table">
          <table>
            <thead>
              <tr>
                <th>列一</th>
                <th>列二</th>
                <th>列三</th>
                <th>列四</th>
                <th>列五</th>
                <th>列六</th>
                <th>列七</th>
                <th>列八</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>数据</td>
                <td>数据</td>
                <td>数据</td>
                <td>数据</td>
                <td>数据</td>
                <td>数据</td>
                <td>数据</td>
                <td>数据</td>
              </tr>
              <tr>
                <td>数据</td>
                <td>数据</td>
                <td>数据</td>
                <td>数据</td>
                <td>数据</td>
                <td>数据</td>
                <td>数据</td>
                <td>数据</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="button-group">
          <el-button type="primary" @click="showScenePage = false">测试</el-button>
        </div>
      </div> -->
      <div class="button-group">
        <router-link to="/task" type="primary"><el-button type="primary">想定（/task）</el-button></router-link>
        <router-link to="/surroundings" type="primary"><el-button type="primary">环境（/surroundings）</el-button></router-link>
        <router-link to="/faBu" type="primary"><el-button type="primary">发布（/faBu）</el-button></router-link>
      </div>

    </div>
    <div class="right">
    </div>
  </div>

</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const showScenePage = ref(false)
const searchText = ref('')

const route = useRoute()
const surroundingsName = ref(route.query.surroundingsName || '')
</script>

<style scoped>
.banner {
  width: 100%;
  height: 50px;
  background-color: #f00;
}

.container {
  display: flex;
  width: 100%;
  height: calc(100vh - 50px);
}

.asider {
  flex: 4;
  background-color: rgb(172, 144, 144);
}

.main {
  flex: 18.5;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
}

.right {
  flex: 4;
  background-color: rgb(70, 70, 80);
}

.main-box {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.main-box h1 {
  margin: 0 0 20px 0;
}

.input-group {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.input-group p {
  margin: 0;
}

.input-group input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
}

.select-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
}

.input-group-textarea {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-group-textarea p {
  margin: 0;
}

.textarea-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  resize: vertical;
}

.textarea-input1 {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  resize: vertical;
  direction: rtl;
  text-align: left;
  overflow-y: scroll;
}

.textarea-input1::-webkit-scrollbar {
  left: 0;
}

.textarea-input2 {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  resize: vertical;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 20px 20px 20px;
}

.scene-page {
  padding: 20px;
}

.scene-header {
  margin-bottom: 20px;
}

.scene-header h2 {
  margin: 0;
  text-align: left;
}

.scene-search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

.scene-table {
  width: 100%;
}

.scene-table table {
  width: 100%;
  border-collapse: collapse;
}

.scene-table th,
.scene-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: center;
}

.scene-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}
</style>
