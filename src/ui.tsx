/** @jsxImportSource preact */

import type { ComponentChildren } from "preact"
import { type User, ShortLink } from "./db.ts"

interface PageProps {
    user?: User | null,
    shortLink?: ShortLink | null,
    shortLinkList?: (ShortLink | null)[]
}

export function Layout({ children, user }: { children: ComponentChildren, user?: User | null }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="stylesheet" href="/static/pico.min.css" />
            </head>
            <body style="margin: 0; min-height: 100vh;">

                {/* Side Bar */}
                <aside style="position: fixed; top: 0; left: 0; width: 200px; height: 100vh; background: var(--pico-primary-background); padding: 1rem; z-index: 100;">
                    <nav>
                        <h3>Linklet</h3>
                        <ul>
                            <li><a href="/">Home</a></li>
                            <li><a href="/links">My Links</a></li>
                            <li><a href="/links/new">New Link</a></li>
                        </ul>
                    </nav>
                </aside>
                {/* Header Bar */}
                <div style="margin-left: 200px; display: flex; flex-direction: column; min-height: 100vh;">
                    <header style="display: flex; justify-content: flex-end; align-items: center; padding: 0.75rem 1.5rem; background: var(--pico-background-color); border-bottom: 1px solid var(--pico-muted-border-color);">
                        <div>
                            {user ? (
                                <span>
                                    {user.login} &nbsp;
                                    <a href="/oauth/signout">Sign Out</a>
                                </span>
                            ) : (
                                <a href="/oauth/signin">Sign In with GitHub</a>
                            )}
                        </div>
                    </header>
                    <main class="container-fluid">
                        {children}
                    </main>

                </div>

            </body>
        </html>
    )
}

export function HomePage({ user }: PageProps) {
    return (
        <Layout user={user}>
            <div>
                {user ? (
                    <div>
                        <h2>Welcome back, {user.login}!</h2>
                    </div>
                ) : (
                    <div>
                        <h2>Welcome to Linklet</h2>
                    </div>
                )}
            </div>
        </Layout>
    )
}

export function CreateShortLinkPage({ user, csrfToken }: PageProps & { csrfToken: string }) {
    return(
        <Layout user={user}>
            <h2>Create New ShortLink</h2>
            <form action="/links" method="POST">
                <input type="hidden" name="_csrf" value={csrfToken} />
                <div>
                    <label>
                        Long URL
                        <input
                            type="url"
                            name="longUrl"
                            required
                            placeholder="https://example.com/your-long-url"
                        />
                    </label>
                </div>
                <button type="submit">Create ShortLink</button>
            </form>
        </Layout>
    )
}

export function LinksPage({ user, shortLinkList }: PageProps) {
    return(
        <Layout user={user}>
            <h2>My Links</h2>
            {shortLinkList && shortLinkList.length > 0 ? (
                shortLinkList.map((link) => (
                    <article key={link?.shortCode}>
                        <h4>{link?.longUrl}</h4>
                        <p><a href={`/links/${link?.shortCode}`}>{link?.shortCode}</a></p>
                        <small>{link?.clickCount} clicks</small>
                    </article>
                ))
            ) : (
                <div>
                    <p>No links yet.</p>
                    <a href="/links/new" role="button">Create your first link</a>
                </div>
            )}
        </Layout>
    )
}

export function NotFoundPage() {
    return (
        <Layout>
            <h2>Page Not Found</h2>
            <p>Sorry, looks like this page doesn't exist.</p>
            <a href="/">Go Home</a>
        </Layout>
    )
}

export function UnauthorizedPage() {
    return (
        <Layout>
            <h2>Sign in required</h2>
            <p>Please sign in to access this page.</p>
            <a href="/oauth/signin" role="button">Sign In with GitHub</a>
        </Layout>
    )
}
