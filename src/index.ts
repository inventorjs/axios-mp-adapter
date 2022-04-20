/**
 * weapp adapter
 * @author: sunkeysun
 */
import statuses from 'statuses'
import axios, { type AxiosAdapter, type AxiosResponse, type AxiosRequestConfig } from 'axios'

declare module 'axios' {
    export interface CancelToken {
        subscribe: (cancel: unknown) => void
        unsubscribe: (cancel: unknown) => void
    }
}

type WxRequestOption = WechatMiniprogram.RequestOption
type BuildUrlParams = Pick<AxiosRequestConfig, 'url' | 'params' | 'paramsSerializer'>

function buildUrl({ url }: BuildUrlParams) {
  return url ?? ''
}

function createError({ errMsg, config, request, code, response }: {
    errMsg: string
    config: AxiosRequestConfig
    code?: number
    request: WechatMiniprogram.RequestTask | null
    response?: AxiosResponse,
}) {
    const error = new Error(errMsg) as Error & { toJSON: () => unknown } 
    !!code && Reflect.set(error, 'code', code)
    !!response && Reflect.set(error, 'response', response)
    Reflect.set(error, 'config', config)
    Reflect.set(error, 'request', request)
    error.toJSON = function () {
        return {
            name: this.name,
            message: this.message,
            stack: this.stack,
            // Axios
            config,
            status: response?.status,
            response,
        }
    }
    return error
}

const weappAdapter: AxiosAdapter = function weappAdapter(config) {
    return new Promise((resolve, reject) => {
        const { baseURL, url, data, headers, params, method, timeout,
                cancelToken, validateStatus, paramsSerializer } = config
        const fullUrl = buildUrl({ url: `${baseURL}${url}`, params, paramsSerializer })
        const httpMethod = typeof method === 'string' ? method.toUpperCase() : method

        // 数据格式抓换使用 axios transform 进行处理，这里默认传输普通字符串
        let request: WechatMiniprogram.RequestTask | null = wx.request({
            url: fullUrl,
            data,
            dataType: '其他',
            header: headers,
            method: httpMethod as WxRequestOption['method'],
            responseType: 'text',
            enableHttp2: true,
            enableQuic: true,
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
                reject(createError({
                    errMsg: `Request failed with status code ${statusCode}`,
                    config,
                    code: statusCode,
                    request,
                    response
                }))
            },
            fail: ({ errMsg }) => {
                reject(createError({ errMsg, config, request }))
            },
            complete: () => {
                typeof cancelToken?.unsubscribe === 'function' && cancelToken.unsubscribe(onCancel)
                request = null
            }
        })

        function onCancel(cancel: unknown) {
            if (!request) return ;
            reject(!cancel || !axios.isCancel(cancel) ? new axios.Cancel('canceled') : cancel)
            request.abort()
            request = null
        }

        typeof cancelToken?.subscribe === 'function' && cancelToken.subscribe(onCancel)
    })
}

export default weappAdapter
