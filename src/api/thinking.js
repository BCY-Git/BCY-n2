
import { fetchGet, fetchPost, fetchPut, fetchDelete, fetchGetPatch, fetchPatch } from '@/utils/http';

export const publishApi={
  getPublish(){
    return fetchGet('/api/drillingOnlineStatus');
  },
  getTaskList(){
    return fetchGet('/api/task/listNoPage');
  },
  updateTask(data){ 
    return fetchPut('/api/task/update', data);
  },
  addTask(data){ 
    return fetchPost('/api/task/add', data);
  },
};

