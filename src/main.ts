import { Router } from "./router.ts";
import { serveDir } from "@std/http/file-server";
import {
  storeShortURL,
  getShortUrl,
  getUserLinks,
  isValidRedirectUrl,
  generateCsrfToken,
  validateCsrfToken,
  checkRateLimit
} from "./db.ts";

import { render } from "preact-render-to-string";
import {
  HomePage,
  UnauthorizedPage,
  CreateShortLinkPage,
  LinksPage,
  NotFoundPage
} from "./ui.tsx";

import { 
  auth, 
  handleGithubCallback, 
  getSessionId 
} from "./auth.ts"


const app = new Router();

// Helper function to wrap page content with full HTML document
function renderPage(pageComponent: any) {
  return `<!DOCTYPE html>${render(pageComponent)}`;
}

app.get("/oauth/signin", (req: Request) => auth.signIn(req))
app.get("/oauth/signout", auth.signOut)
app.get("/oauth/callback", handleGithubCallback)

app.get('/static/*', (req) => serveDir(req, { fsRoot: "static", urlRoot: "static" }))


app.post('/health-check', () => new Response("IT'S ALIVE!"));

function unauthorizedResponse () {
  return new Response(renderPage(UnauthorizedPage()), {
    status: 401,
    headers: { "Content-Type": "text/html" }
  })
}


app.get('/', () => {
  return new Response(
    renderPage(HomePage({ user: app.currentUser })),
    {
      status: 200,
      headers: { "Content-Type": "text/html" }
    }
  );
});


app.get('/links/new', async (req) => {
  if (!app.currentUser) return unauthorizedResponse();

  const sessionId = await getSessionId(req);
  const csrfToken = await generateCsrfToken(sessionId!);

  return new Response(renderPage(CreateShortLinkPage({ csrfToken })), {
    status: 200,
    headers: { "Content-Type": "text/html" }
  })
})


app.post('/links', async (req) => {
  if (!app.currentUser) return unauthorizedResponse();

  const sessionId = await getSessionId(req);
  const formData = await req.formData();
  const csrfToken = formData.get("_csrf") as string;

  if (!sessionId || !csrfToken || !(await validateCsrfToken(sessionId, csrfToken))) {
    return new Response("Invalid CSRF token", {'status': 403})
  }

  const longUrl = formData.get("longUrl") as string;

  if (!longUrl) {
    return new Response( "Missing longUrl", {status: 400})
  }

  if (!isValidRedirectUrl(longUrl)) {
    return new Response("Invalid URL - url must begin with 'http' or 'https'", { status: 400} );
  }

  if (!(await checkRateLimit(app.currentUser.login))) {
    return new Response("Rate limit exceeded. You can create up to 10 links per hour.", { status: 429 });
  }

  try {
    await storeShortURL(longUrl, app.currentUser.login)
  } catch (error) {
    return new Response ("Failed to store shortURL in the database", {status: 500})
  }

  return new Response(null, {
    status: 303,
    headers: {
      "Location": "/links",
    }
  });
});


app.get('/links', async () => {
  if (!app.currentUser) return unauthorizedResponse();

  const shortLinks = await getUserLinks(app.currentUser.login)

  return new Response(renderPage(LinksPage({ shortLinkList: shortLinks })), {
    status: 200,
    headers: { "Content-Type": "text/html" }
  });
});


app.get('/links/:id', async (req) => {
  if (!app.currentUser) return unauthorizedResponse();

  const shortCode = new URL(req.url).pathname.split('/').at(-1);

  const data = await getShortUrl(shortCode || "");
  if (!data || !data.value) {
    return new Response(renderPage(NotFoundPage()), {
      status: 404,
      headers: { "Content-Type": "text/html" }
    })
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});


// TODO: Create an endpoint for seeing realtime usage
app.get('/realtime/:id', (_req, _info, _params) => {
  if (!app.currentUser) return unauthorizedResponse();

  return new Response("Realtime page coming soon", {
    status: 200,
    headers: { "Content-Type": "text/html" }
  })
})


app.get('/:id', async (req) => {
  const shortCode = new URL(req.url).pathname.slice(1);

  if (!shortCode) {
    return new Response(renderPage(NotFoundPage()), {
      status: 404,
      headers: { "Content-Type": "text/html" }
    });
  }

  const shortLink = await getShortUrl(shortCode)

  // TODO: Capture analytics data about the number of times the link was used

  if (shortLink?.value) {

    // Validate the URL before redirecting
    if (!isValidRedirectUrl(longurl)) {
      return new Response("Invalid redirect target", { status: 400 });
    }
    return new Response(null, {
      status: 303,
      headers: { "Location": shortLink.value.longUrl },
    })
  } else {
    return new Response(renderPage(NotFoundPage()), {
      status: 404,
      headers: { "Content-Type": "text/html" }
    });
  }
});

export default {
  fetch(req) {
    return app.handler(req)
  }
} satisfies Deno.ServeDefaultExport;
