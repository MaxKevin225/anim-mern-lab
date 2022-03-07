import axiosClient from "./axiosClient";

const resource = "/users";

const usersAPI = {
  search: (params) => {
    return axiosClient.get(`${resource}/search`, { params });
  },
  register: (payload) => {
    return axiosClient.post(`${resource}/sign-up`, payload);
  },
};

export default usersAPI;
