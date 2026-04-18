import { createGitHubOAuthConfig, createHelpers } from "@deno/kv-oauth";
import { pick } from "@std/collections/pick";
import { type User, getUser, storeUser } from "./db.ts"

export const oauthConfig = createGitHubOAuthConfig({
    redirectUri: Deno.env.get("REDIRECT_URI")
});
export const auth = createHelpers(oauthConfig)

export async function getCurrentUser (req: Request) {
    const sessionId = await auth.getSessionId(req);
    return sessionId ? await getUser(sessionId) : null
}


export async function getGithub (accessToken: string) {
    const response = await fetch("https://api.github.com/user", {
        headers: { authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
        response.body?.cancel();
        throw new Error("Failed to fetch GitHub user");
    }

    return response.json() as Promise<User>
}


export async function handleGithubCallback (req: Request) {
    const { response, tokens, sessionId } = await auth.handleCallback(req);
    const userData = await getGithub(tokens.accessToken)
    const filteredData = pick(userData, [
        "avatar_url", 
        "html_url", 
        "id", 
        "login"
    ]);

    try {
        await storeUser(sessionId, filteredData);
    } catch (error) {
        return new Response ("Problem storing the user session", { status: 500})
    }
    
    return response;
}
