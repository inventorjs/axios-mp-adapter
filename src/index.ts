/**
 * 微信小程序 axios 适配器
 * @author sunkeysun
 */
import statuses from 'statuses'
import axios, { 
  type AxiosAdapter, 
  type AxiosResponse, 
  type InternalAxiosRequestConfig,
  type CancelToken,
  AxiosError, 
  AxiosHeaders
} from 'axios'

/**
 * 扩展的取消令牌类型，支持订阅/取消订阅
 */
type SubsCancelToken = CancelToken & {
  subscribe: (listener: (cancel: unknown) => void) => void
  unsubscribe: (listener: (cancel: unknown) => void) => void
}

type WxRequestOption = WechatMiniprogram.RequestOption
type WxRequestTask = WechatMiniprogram.RequestTask

/**
 * 微信小程序 axios 适配器
 * @param config - Axios 请求配置
 * @returns 返回请求 Promise
 */
const weappAdapter: AxiosAdapter = function weappAdapter(config: InternalAxiosRequestConfig) {
  return new Promise<AxiosResponse>((resolve, reject) => {
    const { data, headers, method, timeout, cancelToken, validateStatus } = config
    const fullUrl = axios.getUri(config)
    const httpMethod = typeof method === 'string' ? method.toUpperCase() : method
    const subsCancelToken = cancelToken as SubsCancelToken

    let request: WxRequestTask | null = null
    
    try {
      // 数据格式转换使用 axios transform 进行处理，这里默认传输普通字符串
      request = wx.request({
        url: fullUrl,
        data,
        dataType: '其他',
        header: headers?.toJSON?.() ?? {},
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
          
          if (!validateStatus || validateStatus(statusCode)) {
            resolve(response)
            return
          }
          
          reject(
            new AxiosError(
              `Request failed with status code ${statusCode}`,
              String(statusCode),
              config,
              request,
              response,
            ),
          )
        },
        fail: ({ errMsg }) => {
          reject(new AxiosError(errMsg, '0', config, request))
        },
        complete: () => {
          subsCancelToken?.unsubscribe?.(onCancel)
          request = null
        },
      })
    } catch (error) {
      // 处理请求创建过程中的异常
      reject(new AxiosError(
        error instanceof Error ? error.message : String(error),
        'ERR_WX_REQUEST',
        config, 
        request
      ))
      return
    }

    /**
     * 取消请求的处理函数
     * @param cancel - 取消信息对象
     */
    function onCancel(cancel: unknown) {
      if (!request) return
      
      // 确保取消操作被正确处理
      reject(
        !cancel || !axios.isCancel(cancel)
          ? new axios.Cancel('canceled')
          : cancel,
      )
      
      request.abort()
      request = null
    }
    
    // 订阅取消令牌
    if (subsCancelToken?.subscribe) {
      subsCancelToken.subscribe(onCancel)
    }
  })
}

export default weappAdapter
