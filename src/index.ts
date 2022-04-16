/**
 * weapp adapter
 * @author: sunkeysun
 */
import axios from 'axios'
import statuses from 'statuses'
import qs from 'qs'
import { type AxiosAdapter, type AxiosResponse, type AxiosRequestConfig } from 'axios'

type WxRequestOption = WechatMiniprogram.RequestOption
type BuildUrlParams = Pick<AxiosRequestConfig, 'baseURL' | 'url' | 'params' | 'paramsSerializer'>

function defaultParamsSerializer(params: AxiosRequestConfig['params']) {
    return qs.stringify(params, { arrayFormat: 'brackets' })
}

function buildUrl({ baseURL, url, params, paramsSerializer = defaultParamsSerializer }: BuildUrlParams) {
    const queryStr = paramsSerializer(params)
    let fullUrl = `${baseURL}${url}`
    if (!queryStr) return fullUrl

    fullUrl += fullUrl.includes('?') ? `&${queryStr}` : `?${queryStr}`
    return fullUrl
}

const weappAdapter: AxiosAdapter = function weappAdapter(config) {
    return new Promise((resolve, reject) => {
        const { baseURL, url, data, headers, params, method, timeout, responseType = 'json',
                cancelToken, validateStatus, paramsSerializer } = config
        const fullUrl = buildUrl({ baseURL, url, params, paramsSerializer })
        const httpMethod = typeof method === 'string' ? method.toUpperCase() : method
        const exCancelToken = cancelToken as typeof cancelToken & { subscribe: any; unsubscribe: any }

        let request: WechatMiniprogram.RequestTask | null = wx.request({
            url: fullUrl,
            data,
            dataType: responseType === 'json' ? 'json' : '其他',
            header: headers,
            method: httpMethod as WxRequestOption['method'],
            responseType: responseType === 'arraybuffer' ? 'arraybuffer' : 'text',
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
                if (!validateStatus || validateStatus && validateStatus(statusCode)) {
                    resolve(response)
                }
                reject(response)
            },
            fail: ({ errMsg }) => {
                reject(new Error(errMsg))
            },
            complete: () => {
                exCancelToken.unsubscribe(onCancel)
                request = null
            }
        })

        function onCancel(cancel: unknown) {
            if (!request) return ;
            reject(!cancel || !axios.isCancel(cancel) ? new axios.Cancel('canceled') : cancel)
            request.abort()
            request = null
        }

        if (exCancelToken) {
            exCancelToken.subscribe(onCancel)
        }
    })
}

export default weappAdapter
