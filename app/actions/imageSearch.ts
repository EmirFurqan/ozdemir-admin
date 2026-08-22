'use server';

export interface FoundImageResult {
    url: string;
    thumbUrl: string;
    title: string;
    width?: number;
    height?: number;
    domain?: string;
    sourcePageUrl?: string;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * Searches the web for product images using DuckDuckGo & Web Image search engines
 */
export async function searchImagesAction({
    query,
    limit = 35
}: {
    query: string;
    limit?: number;
}): Promise<{ success: boolean; results: FoundImageResult[]; message?: string }> {
    if (!query || !query.trim()) {
        return { success: false, results: [], message: "Arama sorgusu belirtilmedi." };
    }

    const cleanQuery = query.trim();

    try {
        // Attempt DuckDuckGo Image Search
        const ddgResults = await fetchDuckDuckGoImages(cleanQuery, limit);
        if (ddgResults && ddgResults.length > 0) {
            return { success: true, results: ddgResults };
        }

        // Fallback: Bing HTML image search
        const bingResults = await fetchBingImages(cleanQuery, limit);
        if (bingResults && bingResults.length > 0) {
            return { success: true, results: bingResults };
        }

        return {
            success: true,
            results: [],
            message: "Aramanıza uygun görsel bulunamadı. Lütfen sorguyu sadeleştirmeyi veya farklı bir arama terimi girmeyi deneyin."
        };
    } catch (error: any) {
        console.error("searchImagesAction error:", error);
        return {
            success: false,
            results: [],
            message: error.message || "Görseller aranırken bir hata oluştu."
        };
    }
}

/**
 * DuckDuckGo Image Search implementation
 */
async function fetchDuckDuckGoImages(query: string, limit: number): Promise<FoundImageResult[]> {
    // 1. Get VQD token from DuckDuckGo
    const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&iar=images&iax=images&ia=images`;
    const tokenRes = await fetch(tokenUrl, {
        headers: {
            'User-Agent': USER_AGENT,
            'Accept-Language': 'tr,en-US;q=0.9,en;q=0.8',
        },
        cache: 'no-store'
    });

    if (!tokenRes.ok) {
        throw new Error(`DuckDuckGo token request failed: ${tokenRes.status}`);
    }

    const html = await tokenRes.text();
    let vqd = "";
    
    // Extract vqd
    const match = html.match(/vqd=['"]?([^&'"]+)['"]?/);
    if (match && match[1]) {
        vqd = match[1];
    } else {
        const match2 = html.match(/vqd=([0-9-]+)&/);
        if (match2 && match2[1]) {
            vqd = match2[1];
        }
    }

    if (!vqd) {
        return [];
    }

    // 2. Fetch images JSON using VQD
    const searchApiUrl = `https://duckduckgo.com/i.js?l=tr-tr&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,;&p=1`;
    const apiRes = await fetch(searchApiUrl, {
        headers: {
            'User-Agent': USER_AGENT,
            'Referer': 'https://duckduckgo.com/',
            'Accept': 'application/json',
        },
        cache: 'no-store'
    });

    if (!apiRes.ok) {
        return [];
    }

    const data = await apiRes.json();
    if (!data || !data.results || !Array.isArray(data.results)) {
        return [];
    }

    const seenUrls = new Set<string>();
    const results: FoundImageResult[] = [];

    for (const item of data.results) {
        if (!item.image || typeof item.image !== 'string') continue;
        if (item.image.startsWith('data:')) continue;
        if (seenUrls.has(item.image)) continue;
        seenUrls.add(item.image);

        let domain = "";
        try {
            domain = new URL(item.url || item.image).hostname.replace(/^www\./, '');
        } catch {
            domain = item.source || "";
        }

        results.push({
            url: item.image,
            thumbUrl: item.thumbnail || item.image,
            title: item.title || query,
            width: item.width || 0,
            height: item.height || 0,
            domain: domain,
            sourcePageUrl: item.url || ""
        });

        if (results.length >= limit) break;
    }

    return results;
}

/**
 * Fallback Bing HTML image search parser
 */
async function fetchBingImages(query: string, limit: number): Promise<FoundImageResult[]> {
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
    const res = await fetch(bingUrl, {
        headers: {
            'User-Agent': USER_AGENT,
            'Accept-Language': 'tr,en;q=0.9',
        },
        cache: 'no-store'
    });

    if (!res.ok) return [];

    const html = await res.text();
    const results: FoundImageResult[] = [];
    const seenUrls = new Set<string>();

    // Bing embeds image json in m="{...}" attributes
    const regex = /m="({&quot;murl&quot;:.*?})"/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
        try {
            const rawJson = match[1].replace(/&quot;/g, '"');
            const data = JSON.parse(rawJson);

            const murl = data.murl;
            const turl = data.turl || murl;
            const title = data.t || query;
            const purl = data.purl || "";

            if (murl && !seenUrls.has(murl) && !murl.startsWith("data:")) {
                seenUrls.add(murl);

                let domain = "";
                try {
                    domain = new URL(purl || murl).hostname.replace(/^www\./, '');
                } catch {
                    domain = "";
                }

                results.push({
                    url: murl,
                    thumbUrl: turl,
                    title: title,
                    width: data.mw || 0,
                    height: data.mh || 0,
                    domain: domain,
                    sourcePageUrl: purl
                });
            }

            if (results.length >= limit) break;
        } catch {
            // Ignore malformed item
        }
    }

    return results;
}

/**
 * Scrapes product images from a given webpage URL (e.g. manufacturer, supplier, catalog page)
 */
export async function scrapePageImagesAction({
    pageUrl
}: {
    pageUrl: string;
}): Promise<{ success: boolean; images: FoundImageResult[]; pageTitle?: string; message?: string }> {
    if (!pageUrl || !pageUrl.trim()) {
        return { success: false, images: [], message: "Lütfen geçerli bir web sayfası URL'si girin." };
    }

    let validUrl = pageUrl.trim();
    if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
        validUrl = "https://" + validUrl;
    }

    try {
        const res = await fetch(validUrl, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'tr,en-US;q=0.9,en;q=0.8',
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            return {
                success: false,
                images: [],
                message: `Sayfaya erişilemedi (HTTP ${res.status}). Lütfen URL'yi kontrol edin.`
            };
        }

        const html = await res.text();
        const foundImages: FoundImageResult[] = [];
        const seenUrls = new Set<string>();

        let domain = "";
        try {
            domain = new URL(validUrl).hostname.replace(/^www\./, '');
        } catch {
            domain = "";
        }

        // 1. Page Title
        let pageTitle = "";
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
            pageTitle = titleMatch[1].trim();
        }

        // Helper to resolve URL
        const resolveUrl = (src: string): string | null => {
            if (!src || src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("javascript:")) {
                return null;
            }
            try {
                return new URL(src, validUrl).toString();
            } catch {
                return null;
            }
        };

        const addImage = (rawUrl: string, title?: string, width?: number, height?: number) => {
            const absoluteUrl = resolveUrl(rawUrl);
            if (!absoluteUrl) return;

            // Filter out common unwanted icons/trackers/spacers
            const lower = absoluteUrl.toLowerCase();
            if (
                lower.includes('favicon') ||
                lower.includes('placeholder') ||
                lower.includes('blank.gif') ||
                lower.includes('spacer.gif') ||
                lower.includes('pixel') ||
                lower.endsWith('.svg')
            ) {
                return;
            }

            if (!seenUrls.has(absoluteUrl)) {
                seenUrls.add(absoluteUrl);
                foundImages.push({
                    url: absoluteUrl,
                    thumbUrl: absoluteUrl,
                    title: title || pageTitle || "Sayfa Görseli",
                    width: width || 0,
                    height: height || 0,
                    domain: domain,
                    sourcePageUrl: validUrl
                });
            }
        };

        // 2. OpenGraph & Twitter Meta tags (usually the highest quality main product images)
        const ogImageMatches = html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|og:image:secure_url|twitter:image)["'][^>]+content=["']([^"']+)["']/gi);
        for (const m of ogImageMatches) {
            if (m[1]) addImage(m[1], pageTitle + " (Kapak)");
        }

        // 3. JSON-LD Schema.org Product images
        const jsonLdMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
        for (const m of jsonLdMatches) {
            try {
                const schema = JSON.parse(m[1]);
                const parseSchema = (obj: any) => {
                    if (!obj) return;
                    if (obj.image) {
                        if (typeof obj.image === 'string') addImage(obj.image, obj.name || pageTitle);
                        else if (Array.isArray(obj.image)) obj.image.forEach((img: any) => {
                            if (typeof img === 'string') addImage(img, obj.name || pageTitle);
                            else if (img && img.url) addImage(img.url, obj.name || pageTitle);
                        });
                        else if (obj.image.url) addImage(obj.image.url, obj.name || pageTitle);
                    }
                    if (Array.isArray(obj['@graph'])) {
                        obj['@graph'].forEach(parseSchema);
                    }
                };
                parseSchema(schema);
            } catch {
                // Ignore parse error in individual schema block
            }
        }

        // 4. Extract <img> tags with high-res attributes (data-zoom, data-large, data-highres, srcset, src)
        const imgTagRegex = /<img\b([^>]*)>/gi;
        let imgMatch;
        while ((imgMatch = imgTagRegex.exec(html)) !== null) {
            const attrs = imgMatch[1];

            // Extract high-res candidate attributes first
            const highResAttrMatch = attrs.match(/(?:data-zoom-image|data-large|data-zoom|data-highres|data-original|data-src)=["']([^"']+)["']/i);
            const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i);
            const altMatch = attrs.match(/\balt=["']([^"']+)["']/i);
            const altText = altMatch ? altMatch[1] : "";

            if (highResAttrMatch && highResAttrMatch[1]) {
                addImage(highResAttrMatch[1], altText || pageTitle);
            } else if (srcMatch && srcMatch[1]) {
                addImage(srcMatch[1], altText || pageTitle);
            }

            // Extract from srcset
            const srcsetMatch = attrs.match(/\bsrcset=["']([^"']+)["']/i);
            if (srcsetMatch && srcsetMatch[1]) {
                const parts = srcsetMatch[1].split(',');
                // Take the largest one (usually the last or with highest 'w' / 'x')
                for (const part of parts) {
                    const cleanPart = part.trim().split(/\s+/)[0];
                    if (cleanPart) addImage(cleanPart, altText || pageTitle);
                }
            }
        }

        return {
            success: true,
            images: foundImages,
            pageTitle: pageTitle
        };
    } catch (error: any) {
        console.error("scrapePageImagesAction error:", error);
        return {
            success: false,
            images: [],
            message: error.message || "Sayfadaki görseller ayıklanırken bir hata oluştu."
        };
    }
}

/**
 * Sends selected remote image URLs to backend to download, 2048x2048 canvas standardize, and save locally
 */
export async function downloadAndSaveImagesAction({
    urls,
    title = "urun-gorseli",
    type = "product"
}: {
    urls: string[];
    title?: string;
    type?: string;
}): Promise<{
    success: boolean;
    savedImages: { url: string; fileName: string; originalUrl: string }[];
    message?: string;
}> {
    if (!urls || urls.length === 0) {
        return { success: false, savedImages: [], message: "İndirilecek görsel seçilmedi." };
    }

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api";
        const res = await fetch(`${apiUrl}/upload/batch-from-urls`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                urls: urls,
                title: title,
                type: type
            })
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Sunucu resimleri indiremedi (${res.status}): ${errBody}`);
        }

        const data = await res.json();
        if (data && data.images && Array.isArray(data.images)) {
            return {
                success: true,
                savedImages: data.images
            };
        } else {
            return {
                success: false,
                savedImages: [],
                message: "Sunucudan geçerli bir görsel yanıtı alınamadı."
            };
        }
    } catch (error: any) {
        console.error("downloadAndSaveImagesAction error:", error);
        return {
            success: false,
            savedImages: [],
            message: error.message || "Görseller indirilirken bir hata oluştu."
        };
    }
}
