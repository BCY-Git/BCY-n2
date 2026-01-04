import axios from 'axios';
import { ElMessage } from 'element-plus';

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 500000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    
    // 从 localStorage 或 sessionStorage 获取 token（根据项目实际情况选择）
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // 如果存在 token，则在请求头中添加
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // 或者使用其他格式，如：
      // config.headers['X-Token'] = token;
    }
    
    // 可以在这里添加其他请求头
    // config.headers['Content-Type'] = 'application/json';
    
    return config;
  },
  error => {
    // 对请求错误做些什么
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    
    const res = response.data;
    
    // 根据后端返回的数据结构进行判断
    // 如果后端返回的格式是 { code: 200, data: {...}, message: '...' }
    if (res.code !== undefined) {
      // 根据实际业务状态码判断
      if (res.code === 200 || res.code === 0) {
        return res; // 返回数据
      } else {
        // 业务错误，显示错误信息
        ElMessage.error(res.message || '请求失败');
        return Promise.reject(new Error(res.message || '请求失败'));
      }
    }
    
    // 如果后端直接返回数据，则直接返回
    return res;
  },
  error => {
    // 对响应错误做点什么
    
    console.error('响应错误:', error);
    
    // 处理 HTTP 状态码错误
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // 未授权，清除 token 并跳转到登录页
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          ElMessage.error('登录已过期，请重新登录');
          // 可以在这里跳转到登录页
          // router.push('/login');
          break;
        case 403:
          ElMessage.error('没有权限访问');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器错误');
          break;
        case 502:
          ElMessage.error('网关错误');
          break;
        case 503:
          ElMessage.error('服务不可用');
          break;
        case 504:
          ElMessage.error('网关超时');
          break;
        default:
          ElMessage.error(data?.message || `请求失败: ${status}`);
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      ElMessage.error('网络错误，请检查网络连接');
    } else {
      // 在设置请求时触发错误
      ElMessage.error(error.message || '请求配置错误');
    }
    
    return Promise.reject(error);
  }
)

export default service