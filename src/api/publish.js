import { fetchGet, fetchPost, fetchPut, fetchDelete, fetchGetPatch, fetchPatch } from '@/utils/http';

export const publishApi={
  getTaskList(){
    return fetchGet('/api/task/drill/listNoPage');
  },
  updataStatus(params){
    return fetchPatch('/api/task/updatePublishStatus',params)
  },
};
