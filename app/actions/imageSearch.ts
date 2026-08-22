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
 * Searches the web for product images using DuckDuckGo & Bing multi-engine search
 */
export async function searchImagesAction({
    query,
    limit = 40
}: {
    query: string;
    limit?: number;
}): Promise<{ success: boolean; results: FoundImageResult[]; message?: string }> {
    if (!query || !query.trim()) {
        return { success: false, results: [], message: "Arama sorgusu belirtilmedi." };
    }

    const cleanQuery = query.trim();

    try {
        // Query both DuckDuckGo and Bing in parallel for maximum reliability and speed
        const [ddgOutcome, bingOutcome] = await Promise.allSettled([
            fetchDuckDuckGoImages(cleanQuery, limit),
            fetchBingImages(cleanQuery, limit)
        ]);

        const ddgResults = ddgOutcome.status === "fulfilled" ? ddgOutcome.value : [];
        const bingResults = bingOutcome.status === "fulfilled" ? bingOutcome.value : [];

        // Combine & deduplicate results
        const seenUrls = new Set<string>();
        const combinedResults: FoundImageResult[] = [];

        // Interleave results from both engines to get maximum variety
        const maxLen = Math.max(ddgResults.length, bingResults.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < ddgResults.length) {
                const item = ddgResults[i];
                if (isValidImageUrl(item.url) && !seenUrls.has(item.url)) {
                    seenUrls.add(item.url);
                    combinedResults.push(item);
                }
            }
            if (i < bingResults.length) {
                const item = bingResults[i];
                if (isValidImageUrl(item.url) && !seenUrls.has(item.url)) {
                    seenUrls.add(item.url);
                    combinedResults.push(item);
                }
            }
            if (combinedResults.length >= limit) break;
        }

        if (combinedResults.length > 0) {
            return { success: true, results: combinedResults };
        }

        return {
            success: true,
            results: [],
            message: "Aramanıza uygun görsel bulunamadı. Lütfen sorguyu sadeleştirmeyi veya önerilen arama çiplerini tıklamayı deneyin."
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

function isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:')) return false;
    const lower = url.toLowerCase();
    if (lower.includes('favicon') || lower.includes('blank.gif') || lower.includes('spacer.gif') || lower.endsWith('.svg')) {
        return false;
    }
    return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * DuckDuckGo Image Search implementation
 */
async function fetchDuckDuckGoImages(query: string, limit: number): Promise<FoundImageResult[]> {
    try {
        // 1. Get VQD token from DuckDuckGo
        const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&iar=images&iax=images&ia=images`;
        const tokenRes = await fetch(tokenUrl, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept-Language': 'tr,en-US;q=0.9,en;q=0.8',
            },
            cache: 'no-store'
        });

        if (!tokenRes.ok) return [];

        const html = await tokenRes.text();
        let vqd = "";
        
        const match = html.match(/vqd=['"]?([^&'"]+)['"]?/);
        if (match && match[1]) {
            vqd = match[1];
        } else {
            const match2 = html.match(/vqd=([0-9-]+)&/);
            if (match2 && match2[1]) {
                vqd = match2[1];
            }
        }

        if (!vqd) return [];

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

        if (!apiRes.ok) return [];

        const data = await apiRes.json();
        if (!data || !data.results || !Array.isArray(data.results)) return [];

        const results: FoundImageResult[] = [];
        for (const item of data.results) {
            if (!item.image || typeof item.image !== 'string') continue;

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
    } catch (err) {
        console.error("DDG fetch error:", err);
        return [];
    }
}

/**
 * Bing Async Image Search implementation
 */
async function fetchBingImages(query: string, limit: number): Promise<FoundImageResult[]> {
    try {
        const bingUrl = `https://www.bing.com/images/async?q=${encodeURIComponent(query)}&first=0&count=${limit}&mmasync=1`;
        const res = await fetch(bingUrl, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': '*/*',
                'Accept-Language': 'tr,en-US;q=0.9,en;q=0.8',
            },
            cache: 'no-store'
        });

        if (!res.ok) return [];

        const html = await res.text();
        const results: FoundImageResult[] = [];
        const seenUrls = new Set<string>();

        // 1. Detail links parser (mediaurl parameter)
        const regex = /href="\/images\/search\?view=detailV2&amp;([^"]+)"/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
            try {
                const queryParams = new URLSearchParams(match[1].replace(/&amp;/g, '&'));
                const mediaUrl = queryParams.get('mediaurl');
                const cdnUrl = queryParams.get('cdnurl') || mediaUrl;
                const width = parseInt(queryParams.get('expw') || '0', 10);
                const height = parseInt(queryParams.get('exph') || '0', 10);

                if (mediaUrl && !seenUrls.has(mediaUrl)) {
                    seenUrls.add(mediaUrl);
                    let domain = "";
                    try {
                        domain = new URL(mediaUrl).hostname.replace(/^www\./, '');
                    } catch {}

                    results.push({
                        url: mediaUrl,
                        thumbUrl: cdnUrl || mediaUrl,
                        width,
                        height,
                        domain,
                        title: query
                    });
                }
            } catch {}
            if (results.length >= limit) break;
        }

        // 2. m="..." attributes parser
        if (results.length < limit) {
            const mRegex = /m="({[^"]+})"/g;
            let mMatch;
            while ((mMatch = mRegex.exec(html)) !== null) {
                try {
                    const raw = mMatch[1].replace(/&quot;/g, '"');
                    const data = JSON.parse(raw);
                    const mediaUrl = data.murl || data.turl;
                    if (mediaUrl && !seenUrls.has(mediaUrl)) {
                        seenUrls.add(mediaUrl);
                        let domain = "";
                        try {
                            domain = new URL(data.purl || mediaUrl).hostname.replace(/^www\./, '');
                        } catch {}
                        results.push({
                            url: mediaUrl,
                            thumbUrl: data.turl || mediaUrl,
                            title: data.t || query,
                            width: data.mw || 0,
                            height: data.mh || 0,
                            domain,
                            sourcePageUrl: data.purl || ""
                        });
                    }
                } catch {}
                if (results.length >= limit) break;
            }
        }

        return results;
    } catch (err) {
        console.error("Bing fetch error:", err);
        return [];
    }
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
            if (!absoluteUrl || !isValidImageUrl(absoluteUrl)) return;

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

        // 2. OpenGraph & Twitter Meta tags
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
            } catch {}
        }

        // 4. Extract <img> tags with high-res attributes
        const imgTagRegex = /<img\b([^>]*)>/gi;
        let imgMatch;
        while ((imgMatch = imgTagRegex.exec(html)) !== null) {
            const attrs = imgMatch[1];
            const highResAttrMatch = attrs.match(/(?:data-zoom-image|data-large|data-zoom|data-highres|data-original|data-src)=["']([^"']+)["']/i);
            const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i);
            const altMatch = attrs.match(/\balt=["']([^"']+)["']/i);
            const altText = altMatch ? altMatch[1] : "";

            if (highResAttrMatch && highResAttrMatch[1]) {
                addImage(highResAttrMatch[1], altText || pageTitle);
            } else if (srcMatch && srcMatch[1]) {
                addImage(srcMatch[1], altText || pageTitle);
            }

            const srcsetMatch = attrs.match(/\bsrcset=["']([^"']+)["']/i);
            if (srcsetMatch && srcsetMatch[1]) {
                const parts = srcsetMatch[1].split(',');
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
