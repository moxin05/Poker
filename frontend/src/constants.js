/**
 * 前端常量定义
 */
export const BACKEND_URL = 'http://localhost:8000'

export const SUIT_MAP = {
  spade:   { symbol: '♠', color: 'black' },
  heart:   { symbol: '♥', color: 'red' },
  diamond: { symbol: '♦', color: 'red' },
  club:    { symbol: '♣', color: 'black' },
}

export const DURATION_OPTIONS = [5, 10, 15, 20, 30, 60]

// 原神素材 CDN
export const GI_ASSETS = {
  // 背景 - 蒙德风景
  bgMain: 'https://uploadstatic-sea.mihoyo.com/contentweb/20210722/2021072210584866498.jpg',
  // Logo
  logo: 'https://webstatic.mihoyo.com/upload/op-public/2022/07/13/3abb530ae7e0c4e85008db2b0895c5f4_2256901937140498284.png',
  // 角色 - 温迪
  charVenti: 'https://upload-static.hoyoverse.com/event/2021/02/04/a35e0ddb5eab79bdd3a90c0f0d17ed27_1455741038838498589.png',
}
