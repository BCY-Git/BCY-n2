import { fetchGet, fetchPost, fetchPut, fetchDelete, fetchGetPatch, fetchPatch } from './http';

export const publishApi={
  getPublish(){
    return fetchGet('/api/publish');
  },
  addPublish(data){
    return fetchPost('/api/publish', data);
  },
  updatePublish(data){
    return fetchPut('/api/publish', data);
  },
  deletePublish(data){
    return fetchDelete('/api/publish', data);
  }
};

