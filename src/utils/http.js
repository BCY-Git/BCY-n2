import request from "./request.js";

export const fetchGet = (url, params) => {
  return request({
    url: url,
    method: "GET",
    params: params
  })
}

export const fetchPost = (url, data) => {
  return request({
    url: url,
    method: "POST",
    data: data
  })
}

export const fetchPut = (url, data) => {
  return request({
    url: url,
    method: "PUT",
    data: data
  })
}

export const fetchDelete = (url, params) => {
  return request({
    url: url,
    method: "DELETE",
    params: params
  })
}

export const fetchGetPatch = (url, params) => {
  return request({
    url: url+'/'+params,
    method: "GET",
  });
};

export const fetchPatch = (url, data) => {
  return request({
    url: url,
    method: "PATCH",
    data: data
  });
};
