import { encodeBase64Url } from "@std/encoding";

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

// TODO: Implement Analytic Capture
export type ClickAnalytics = {
  shortUrl: string;
  clickCount: number;
  createdAt: Date;
};


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
    const userShortLinkKeys = res.map((v) => ["shortlink", v.value])

    const userRes = await kv.getMany<ShortLink[]>(userShortLinkKeys);
    const userShortLinks = await Array.fromAsync(userRes)
    return userShortLinks.map((v) => v.value)
}


// Manage Users
export async function storeUser (sessionId: string, userData: User) {
    const res = await kv.set(["sessionId", sessionId], userData)
    return res;
}

export async function getUser (sessionId: string) {
    const res = await kv.get<User>(["sessionId", sessionId])
    return res.value || null;
}
