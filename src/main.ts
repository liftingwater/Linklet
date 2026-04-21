import { Router } from "./router.ts";
import { 
  storeShortURL,
  getShortUrl,
  getUserLinks
} from "./db.ts";

import { render } from "preact-render-to-string";
import {
  HomePage,
  UnauthorizedPage,
  CreateShortLinkPage,
  LinksPage,
  NotFoundPage
} from "./ui.tsx";

import { auth, handleGithubCallback } from "./auth.ts"


const app = new Router();


app.get("/oauth/signin", (req: Request) => auth.signIn(req))
app.get("/oauth/signout", auth.signOut)
app.get("/oauth/callback", handleGithubCallback)


app.post('/health-check', () => new Response("IT'S ALIVE!"));

function unauthorizedResponse () {
  return new Response(render(UnauthorizedPage()), {
    status: 401,
    headers: { "Content-Type": "text/html" }
  })
}


app.get('/', () => { 
  return new Response(
    render(HomePage({ user: app.currentUser })), 
    {
      status: 200,
      headers: { "Content-Type": "text/html" }
    }
  );
});


app.get('/links/new', (_req) => {
  if (!app.currentUser) return unauthorizedResponse();

  return new Response(render(CreateShortLinkPage()), {
    status: 200,
    headers: { "Content-Type": "text/html" }
  })
})


app.post('/links', async (req) => {
  if (!app.currentUser) return unauthorizedResponse();

  const formData = await req.formData();
  const longUrl = formData.get("longUrl") as string;

  if (!longUrl) {
    return new Response( "Missing longUrl", {status: 400})
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

  return new Response(render(LinksPage({ shortLinkList: shortLinks })), {
    status: 200,
    headers: { "Content-Type": "text/html" }
  });
});


app.get('/links/:id', async (req) => {
  if (!app.currentUser) return unauthorizedResponse();

  const shortCode = new URL(req.url).pathname.split('/').at(-1);

  const data = await getShortUrl(shortCode || "");
  if (!data || !data.value) {
    return new Response(render(NotFoundPage()), {
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
    return new Response(render(NotFoundPage()), {
      status: 404,
      headers: { "Content-Type": "text/html" }
    });
  }

  const shortLink = await getShortUrl(shortCode)

  // TODO: Capture analytics data about the number of times the link was used

  if (shortLink) {
    return new Response(null, {
      status: 303,
      headers: { "Location": shortLink.value!.longUrl },
    })
  } else {
    return new Response(render(NotFoundPage()), {
      status: 404,
      headers: { "Content-Type": "text/html" }
    });
  }
});

const port = parseInt(Deno.env.get("PORT") || "8000", 10);

export default {
  port,
  fetch(req) {
    return app.handler(req)
  }
} satisfies Deno.ServeDefaultExport;
