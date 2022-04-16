/**
 * weapp adapter
 * @author: sunkeysun
 */
import statuses from 'statuses'
import qs from 'qs'
import { type AxiosAdapter, type AxiosResponse, type AxiosRequestConfig, AxiosError } from 'axios'

type WxRequestOption = WechatMiniprogram.RequestOption
type BuildUrlParams = Pick<AxiosRequestConfig, 'baseURL' | 'url' | 'params' | 'paramsSerializer'>

function buildUrl({ baseURL, url, params, paramsSerializer = qs.stringify }: BuildUrlParams) {
    let queryStr = paramsSerializer(params)
    let fullUrl = `${baseURL}${url}`
    if (!queryStr) return fullUrl

    fullUrl += fullUrl.includes('?') ? `&${queryStr}` : `?${queryStr}`
    return fullUrl
}

const weappAdapter: AxiosAdapter = function weappAdapter(config) {
    return new Promise((resolve, reject) => {
        const { baseURL, url, data, headers, params, method, timeout,
                cancelToken, signal, validateStatus, paramsSerializer } = config
        const fullUrl = buildUrl({ baseURL, url, params, paramsSerializer })
        const httpMethod = typeof method === 'string' ? method.toUpperCase() : method

        const request = wx.request({
            url: fullUrl,
            data,
            dataType: 'json',
            header: headers,
            method: httpMethod as WxRequestOption['method'],
            responseType: 'text',
            timeout,
            success: ({ header, data, statusCode }) => {
                const response: AxiosResponse = {
                    data,
                    status: statusCode,
                    statusText: statuses.message[statusCode] ?? '',
                    headers: header,
                    config,
                    request,
                }
                if (!validateStatus || validateStatus && !validateStatus(statusCode)) {
                    resolve(response)
                }
                reject(response)
            },
            fail: ({ errMsg }) => {
                reject(new Error(errMsg))
            },
            complete: ({ errMsg }) => {}
        })
    })
}

export default weappAdapter
