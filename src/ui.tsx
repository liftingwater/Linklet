/** @jsxImportSource preact */

import { ComponentChildren } from "preact"
import { type User, ShortLink } from "./db.ts"

interface PageProps {
    user?: User | null,
    shortLink?: ShortLink | null,
    shortLinkList?: (ShortLink | null)[]
}

export function Layout({ children }: {children: ComponentChildren}) {
    return (
        <html>
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link
                href="https://cdn.jsdelivr.net/npm/daisyui@4.12.13/dist/full.min.css"
                rel="stylesheet"
                type="text/css"
                />
                <script src="https://cdn.tailwindcss.com"></script>
            </head>

            <body>
                <header>
                    <nav>
                        <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/links">My Links</a></li>
                        <li><a href="/links/new">Create Links</a></li>
                        </ul>
                    </nav>
                </header>

                <main>
                    {children}
                </main>

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
