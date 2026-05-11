import { encodeBase64, encodeBase64Url } from "@std/encoding";

const kv = await Deno.openKv()

export type ShortLink = {
    shortCode: string;
    longUrl: string;
    createdAt: number;
    userId: string;
    clickCount: number;
    lastClickEvent?: string;
};

export type User = {
    id: string,
    login: string,
    avatar_url: string,
    html_url: string
}


const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;


// TODO: Implement Analytic Capture
export type ClickAnalytics = {
  shortUrl: string;
  clickCount: number;
  createdAt: Date;
};


// URL validation
export function isValidRedirectUrl(url: string): boolean {
    try {
        const parsed_input = new URL(url);
        return parsed_input.protocol in ["http", "https"];
    } catch {
        return false;
    }
}


// csrf token management
export async function generateCsrfToken(sessionId: string): Promise<string> {
    const csrfToken = encodeBase64(crypto.getRandomValues(new Uint8Array(32)));
    // Expire after 1 hour
    await kv.set (["csrf", sessionId, csrfToken], true, { expireIn: 3600 * 1000});
    return csrfToken
}


export async function validateCsrfToken(sessionId: string, token: string): Promise<boolean> {
    const csrfRecord = await kv.get(["csrf", sessionId, token])
    if (!csrfRecord.value) { return false }
    await kv.delete(["csrf", sessionId, token]);
    return true;
}


// Manage Links
export async function generateUrlShortCode (longUrl: string) {

    const urlData = new TextEncoder().encode(longUrl + Date.now())

    const hash = await crypto.subtle.digest("SHA-256", urlData);

    const shortCode = encodeBase64Url(hash.slice(0, 8));
    return shortCode
}


export async function storeShortURL (
    longUrl: string, 
    userId: string
) {

    const shortCode = await generateUrlShortCode(longUrl)

    // Place the record in the database
    // Set keys
    const shortLinkKey = ["shortlink", shortCode]
    const userKey = [userId, shortCode];
    // Record Data
    const data: ShortLink = {
        shortCode,
        longUrl,
        userId,
        createdAt: Date.now(),
        clickCount: 0,
    };

    const res = await kv.atomic()
        .set(shortLinkKey, data)
        .set(userKey, shortCode)
        .commit();

    if (!res.ok) {
        console.error("Failed to store shortURL in the database", JSON.stringify(res))
        throw new Error("Failed to store shortURL in the database")
    }

    return res;
}

export async function getShortUrl (shortCode: string) {
    const link = await kv.get<ShortLink>(["shortlink", shortCode])
    return link
}

export async function getUserLinks (userId: string) {
    const kv_list = kv.list<string>({ prefix: [userId] });
    const res = await Array.fromAsync(kv_list);
    const userShortLinkKeys = res.map((link) => ["shortlink", link.value])

    const userRes = await kv.getMany<ShortLink[]>(userShortLinkKeys);
    const userShortLinks = await Array.fromAsync(userRes)
    return userShortLinks.map((link) => link.value)
}


// Manage Users
export async function storeUser (sessionId: string, userData: User) {
    return await kv.set(["sessionId", sessionId], { ...userData, createdAt: Date.now() }, { expireIn: SESSION_TTL_MS })
}

export async function getUser (sessionId: string) {
    const res = await kv.get<User>(["sessionId", sessionId]);
    if (!res.value) return null;

    if (Date.now() - res.value.createdAt > SESSION_TTL_MS) {
        await kv.delete(["sessionId", sessionId]);
        return null;
    }

    console.log(res)

    const { createdAt: _, ...user } = res.value;
    return user || null;
}
