/**
 * weapp adapter
 * @author: sunkeysun
 */
import qs from 'qs'
import statuses from 'statuses'
import axios, { type AxiosAdapter, type AxiosResponse, type AxiosRequestConfig } from 'axios'

type WxRequestOption = WechatMiniprogram.RequestOption
type BuildUrlParams = Pick<AxiosRequestConfig, 'baseURL' | 'url' | 'params' | 'paramsSerializer'>

function defaultParamsSerializer(params: AxiosRequestConfig['params']) {
    return qs.stringify(params, { arrayFormat: 'brackets' })
}

function buildUrl({ baseURL, url, params, paramsSerializer = defaultParamsSerializer }: BuildUrlParams) {
    const queryStr = paramsSerializer(params)
    let fullUrl = `${baseURL}${url}`
    if (!queryStr) return fullUrl

    const hashIndex = fullUrl.indexOf('#')
    let hashStr = ''
    if (!!~hashIndex) {
        hashStr = fullUrl.slice(hashIndex)
        fullUrl = fullUrl.slice(0, hashIndex)
    }
    fullUrl += fullUrl.includes('?') ? `&${queryStr}` : `?${queryStr}` + hashStr
    return fullUrl
}

function createError({ errMsg, config, request }: {
    errMsg: string
    config: AxiosRequestConfig
    request: WechatMiniprogram.RequestTask | null
}) {
    const error = new Error(errMsg) as Error & { toJSON: () => unknown } 
    Reflect.set(error, 'config', config)
    Reflect.set(error, 'request', request)
    error.toJSON = function () {
        return {
            message: this.message,
            stack: this.stack,
            config,
        }
    }
    return error
}

const weappAdapter: AxiosAdapter = function weappAdapter(config) {
    return new Promise((resolve, reject) => {
        const { baseURL, url, data, headers, params, method, timeout,
                cancelToken = {}, validateStatus, paramsSerializer } = config
        const fullUrl = buildUrl({ baseURL, url, params, paramsSerializer })
        const httpMethod = typeof method === 'string' ? method.toUpperCase() : method
        const exCancelToken = cancelToken as typeof cancelToken & { subscribe: unknown; unsubscribe: unknown }

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
                reject(response)
            },
            fail: ({ errMsg }) => {
                reject(createError({ errMsg, config, request }))
            },
            complete: () => {
                typeof exCancelToken.unsubscribe === 'function' && exCancelToken.unsubscribe(onCancel)
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
            typeof exCancelToken.subscribe === 'function' && exCancelToken.subscribe(onCancel)
        }
    })
}

export default weappAdapter
