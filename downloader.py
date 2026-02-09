"""
原神素材爬取工具
- 支持 SPA 网站（从源码中正则提取所有图片 URL）
- 支持多页面批量爬取
- 支持从 CSS/JS 中提取图片引用
- 支持指定保存目录
- 自动过滤小图/图标，只保留有价值的素材
"""
import os
import re
import sys
import hashlib
import requests
from urllib.parse import urljoin, urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

# ==================== 配置 ====================

SAVE_DIR = os.path.join(os.path.dirname(__file__), 'frontend', 'public', 'assets')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                  'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8',
}

# 要爬取的页面列表
TARGET_URLS = [
    'https://ys.mihoyo.com/main/',
    'https://ys.mihoyo.com/main/character/mondstadt',
    'https://ys.mihoyo.com/main/character/liyue',
    'https://ys.mihoyo.com/main/news',
]

# 额外的已知高清素材（这些 CDN 可以直接下载）
EXTRA_RESOURCES = {
    # 角色祈愿立绘 (来自 enka.network，公开可用)
    'venti.png':     'https://enka.network/ui/UI_Gacha_AvatarImg_Venti.png',
    'keqing.png':    'https://enka.network/ui/UI_Gacha_AvatarImg_Keqing.png',
    'zhongli.png':   'https://enka.network/ui/UI_Gacha_AvatarImg_Zhongli.png',
    'raiden.png':    'https://enka.network/ui/UI_Gacha_AvatarImg_Shougun.png',
    'nahida.png':    'https://enka.network/ui/UI_Gacha_AvatarImg_Nahida.png',
    'hutao.png':     'https://enka.network/ui/UI_Gacha_AvatarImg_Hutao.png',
    'ganyu.png':     'https://enka.network/ui/UI_Gacha_AvatarImg_Ganyu.png',
    'ayaka.png':     'https://enka.network/ui/UI_Gacha_AvatarImg_Ayaka.png',
    # 角色头像
    'icon_venti.png':  'https://enka.network/ui/UI_AvatarIcon_Venti.png',
    'icon_keqing.png': 'https://enka.network/ui/UI_AvatarIcon_Keqing.png',
    # 高清背景（Unsplash 风景）
    'bg-mountain.jpg': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=85',
    'bg-fantasy.jpg':  'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=85',
    'bg-valley.jpg':   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85',
}

# 图片 URL 匹配正则（匹配 .jpg .png .webp .jpeg .svg .gif）
IMG_URL_PATTERN = re.compile(
    r'(https?://[^\s\'"<>]+?\.(?:jpg|jpeg|png|webp|gif|svg)(?:\?[^\s\'"<>]*)?)',
    re.IGNORECASE
)

# 最小文件大小（过滤小图标，低于此值跳过）
MIN_FILE_SIZE = 5 * 1024  # 5KB

# ==================== 核心逻辑 ====================

def fetch_page(url):
    """获取页面源码"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f'  [跳过] 无法访问 {url}: {e}')
        return ''


def extract_image_urls(html, base_url):
    """从 HTML/JS/CSS 源码中提取所有图片 URL"""
    urls = set()

    # 1. 正则匹配所有图片 URL
    for match in IMG_URL_PATTERN.findall(html):
        full = urljoin(base_url, match)
        urls.add(full)

    # 2. 匹配 url('...') 中的路径
    for match in re.findall(r'url\(["\']?(.*?\.(?:jpg|jpeg|png|webp|gif))["\']?\)', html, re.I):
        full = urljoin(base_url, match)
        if full.startswith('http'):
            urls.add(full)

    # 3. 匹配 src="..." data-src="..." poster="..." 等属性
    for match in re.findall(r'(?:src|data-src|poster|content)=["\']([^"\']+\.(?:jpg|jpeg|png|webp|gif)[^"\']*)["\']', html, re.I):
        full = urljoin(base_url, match)
        if full.startswith('http'):
            urls.add(full)

    return urls


def extract_asset_links(html, base_url):
    """提取页面引用的 CSS/JS 文件 URL（用于进一步搜索图片）"""
    links = set()
    for match in re.findall(r'(?:href|src)=["\']([^"\']+\.(?:css|js))["\']', html, re.I):
        full = urljoin(base_url, match)
        if full.startswith('http'):
            links.add(full)
    return links


def download_file(url, save_path):
    """下载单个文件"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20, stream=True)
        resp.raise_for_status()

        content = resp.content
        if len(content) < MIN_FILE_SIZE:
            return None, 'too_small'

        with open(save_path, 'wb') as f:
            f.write(content)
        return save_path, len(content)
    except Exception as e:
        return None, str(e)


def safe_filename(url, index=0):
    """从 URL 生成安全的文件名"""
    parsed = urlparse(url)
    name = os.path.basename(parsed.path)

    # 清理文件名
    name = re.sub(r'[^\w.\-]', '_', name)

    if not name or len(name) > 60 or name.startswith('.'):
        ext = '.jpg'
        for e in ['.png', '.webp', '.gif', '.svg', '.jpeg']:
            if e in url.lower():
                ext = e
                break
        name = f'img_{index}_{hashlib.md5(url.encode()).hexdigest()[:8]}{ext}'

    return name


def crawl_page(url, all_img_urls):
    """爬取单个页面的所有图片 URL"""
    print(f'\n📄 爬取页面: {url}')
    html = fetch_page(url)
    if not html:
        return

    # 从页面提取图片
    imgs = extract_image_urls(html, url)
    print(f'   找到 {len(imgs)} 个图片 URL')
    all_img_urls.update(imgs)

    # 从 CSS/JS 文件中提取更多图片
    asset_links = extract_asset_links(html, url)
    print(f'   找到 {len(asset_links)} 个 CSS/JS 文件，正在扫描...')

    for link in list(asset_links)[:20]:  # 限制最多扫描20个文件
        asset_html = fetch_page(link)
        if asset_html:
            more_imgs = extract_image_urls(asset_html, link)
            all_img_urls.update(more_imgs)


def main():
    os.makedirs(SAVE_DIR, exist_ok=True)
    print(f'🎯 保存目录: {SAVE_DIR}')
    print(f'🌐 目标页面: {len(TARGET_URLS)} 个')
    print(f'🎨 额外素材: {len(EXTRA_RESOURCES)} 个')
    print('=' * 60)

    # ── 阶段1: 爬取页面图片 ──
    all_img_urls = set()
    for url in TARGET_URLS:
        crawl_page(url, all_img_urls)

    print(f'\n📊 总共发现 {len(all_img_urls)} 个不重复的图片 URL')

    # ── 阶段2: 下载页面图片 ──
    print('\n' + '=' * 60)
    print('⬇️  开始下载页面图片...\n')

    downloaded = 0
    skipped = 0
    failed = 0

    for i, url in enumerate(sorted(all_img_urls)):
        fname = safe_filename(url, i)
        fpath = os.path.join(SAVE_DIR, fname)

        if os.path.exists(fpath):
            skipped += 1
            continue

        result, info = download_file(url, fpath)
        if result:
            size_kb = info / 1024
            print(f'  ✅ {fname} ({size_kb:.0f}KB)')
            downloaded += 1
        elif info == 'too_small':
            skipped += 1
        else:
            failed += 1

    print(f'\n  页面图片: 下载 {downloaded}, 跳过 {skipped}, 失败 {failed}')

    # ── 阶段3: 下载额外高清素材 ──
    print('\n' + '=' * 60)
    print('🎨 下载额外高清素材...\n')

    for fname, url in EXTRA_RESOURCES.items():
        fpath = os.path.join(SAVE_DIR, fname)
        if os.path.exists(fpath) and os.path.getsize(fpath) > MIN_FILE_SIZE:
            print(f'  ⏭️  {fname} (已存在)')
            continue

        result, info = download_file(url, fpath)
        if result:
            size_kb = info / 1024
            print(f'  ✅ {fname} ({size_kb:.0f}KB)')
        else:
            print(f'  ❌ {fname}: {info}')

    # ── 完成 ──
    print('\n' + '=' * 60)
    all_files = os.listdir(SAVE_DIR)
    total_size = sum(os.path.getsize(os.path.join(SAVE_DIR, f)) for f in all_files)
    print(f'🏁 完成！共 {len(all_files)} 个文件，总大小 {total_size/1024/1024:.1f}MB')
    print(f'📁 {SAVE_DIR}')


if __name__ == '__main__':
    main()
