/** @jsxImportSource preact */

import type { ComponentChildren } from "preact"
import { type User, ShortLink } from "./db.ts"

interface PageProps {
    user?: User | null,
    shortLink?: ShortLink | null,
    shortLinkList?: (ShortLink | null)[]
}

export function Layout({ children }: {children: ComponentChildren}) {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="stylesheet" href="/static/pico.min.css" />
            </head>
            <body>
                <div class="grid" style="grid-template-columns: 200px 1fr; min-height: 100vh; gap: 0;">
                    <aside style="background: var(--pico-primary-background); padding: 1rem;">
                        <nav>
                            <h3>Linklet</h3>
                            <ul>
                                <p><a href="/">Home</a></p>
                                <p><a href="/links">My Links</a></p>
                                <p><a href="/links/new">New Link</a></p>
                            </ul>
                        </nav>
                    </aside>
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
        <Layout>
            <div>
                <div>
                    {user ? (
                    <div>
                        <div>Welcome back, {user.login}!</div>
                        <div>
                        <a href="/oauth/signout">Sign Out</a>
                        </div>
                    </div>
                    ) : (
                    <a href="/oauth/signin">Sign In with GitHub</a>
                    )}
                </div>
            </div>
        </Layout>
    )
}

export function CreateShortLinkPage() {
    return(
        <Layout>
            <h2>Create New ShortLink</h2>
            <form action="/links" method="POST">
                <div>
                    <label>
                        <span>Long URL</span>
                    </label>
                    <input
                        type="url"
                        name="longUrl"
                        required placeholder="https://example.com/your-long-url"
                    />
                </div>
                <button type="submit">
                    Create ShortLink
                </button>
            </form>
        </Layout>
    )
}

export function LinksPage({ shortLinkList }: PageProps) {
    return(
        <Layout>
            {shortLinkList?.map((link) => (
              <div key={link?.shortCode} >
                <div>
                  <h3><a href={`/links/${link?.shortCode}`}>{link?.shortCode}</a></h3>
                  <p>
                    {link?.longUrl}
                  </p>
                  <div>
                    <div>
                      {link?.clickCount} clicks
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </Layout>
    )
}


export function NotFoundPage() {
    return (
        <Layout>
            <p>Sorry, looks like this page doesn't exist.</p>
        </Layout>
    )
}

export function UnauthorizedPage() {
    return (
        <Layout>
            <h2>User not logged in</h2>
            <p>Please log in to use this app</p>
        </Layout>
    )
}
