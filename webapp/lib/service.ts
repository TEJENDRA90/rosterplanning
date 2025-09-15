import axios, { AxiosRequestConfig } from "axios";

const api = axios.create();

export const get = async (url: string, config?: AxiosRequestConfig) => api.get(url, config);
export const post = async (url: string, data?: any, config?: AxiosRequestConfig) => api.post(url, data, config);
export const put = async (url: string, data?: any, config?: AxiosRequestConfig) => api.put(url, data, config);
export const del = async (url: string, config?: AxiosRequestConfig) => api.delete(url, config); 