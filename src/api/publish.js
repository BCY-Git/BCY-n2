import { fetchGet, fetchPost, fetchPut, fetchDelete, fetchGetPatch, fetchPatch } from '@/utils/http';

export const publishApi={
  getPublish(){
    return fetchGet('/api/drillingOnlineStatus');
  },

};