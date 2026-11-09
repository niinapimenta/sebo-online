const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "authorization",
  "content-type",
  "cookie",
  "origin",
  "referer",
  "x-csrf-token",
  "x-requested-with",
  "x-xsrf-token",
] as const;

const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "set-cookie",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function getLaravelBaseUrl(): URL {
  const configuredUrl = process.env.LARAVEL_INTERNAL_URL?.trim();

  if (!configuredUrl) {
    throw new Error("LARAVEL_INTERNAL_URL is not configured.");
  }

  let baseUrl: URL;

  try {
    baseUrl = new URL(configuredUrl);
  } catch {
    throw new Error("LARAVEL_INTERNAL_URL must be a valid HTTP(S) origin.");
  }

  const hostname = baseUrl.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const isLoopback =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";

  if (
    (baseUrl.protocol !== "https:" &&
      !(baseUrl.protocol === "http:" && isLoopback)) ||
    baseUrl.username !== "" ||
    baseUrl.password !== "" ||
    (baseUrl.pathname !== "" && baseUrl.pathname !== "/") ||
    baseUrl.search !== "" ||
    baseUrl.hash !== ""
  ) {
    throw new Error("LARAVEL_INTERNAL_URL must be a valid HTTP(S) origin.");
  }

  baseUrl.pathname = "/";
  return baseUrl;
}

function isAllowedProxyPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/logout" ||
    pathname === "/sanctum/csrf-cookie" ||
    pathname === "/api" ||
    pathname.startsWith("/api/")
  );
}

function makeUpstreamUrl(request: Request, baseUrl: URL): URL {
  const incomingUrl = new URL(request.url);

  if (!isAllowedProxyPath(incomingUrl.pathname)) {
    throw new Error("Request path is not allowed by the Laravel proxy.");
  }

  const upstreamUrl = new URL(baseUrl);
  upstreamUrl.pathname = incomingUrl.pathname;
  upstreamUrl.search = incomingUrl.search;

  return upstreamUrl;
}

function removeCookieDomainAttribute(setCookie: string): string {
  return setCookie
    .split(";")
    .filter((attribute, index) => {
      return index === 0 || !/^\s*domain\s*=/i.test(attribute);
    })
    .join(";");
}

function copyResponseHeaders(upstreamResponse: Response, upstreamBaseUrl: URL): Headers {
  const responseHeaders = new Headers();

  for (const [name, value] of upstreamResponse.headers) {
    if (HOP_BY_HOP_RESPONSE_HEADERS.has(name.toLowerCase())) {
      continue;
    }

    if (name.toLowerCase() === "location") {
      try {
        const locationUrl = new URL(value, upstreamBaseUrl);

        responseHeaders.set(
          name,
          locationUrl.origin === upstreamBaseUrl.origin
            ? `${locationUrl.pathname}${locationUrl.search}${locationUrl.hash}`
            : value,
        );
      } catch {
        responseHeaders.set(name, value);
      }

      continue;
    }

    responseHeaders.append(name, value);
  }

  for (const setCookie of upstreamResponse.headers.getSetCookie()) {
    responseHeaders.append(
      "Set-Cookie",
      removeCookieDomainAttribute(setCookie),
    );
  }

  return responseHeaders;
}

export async function proxyLaravelRequest(request: Request): Promise<Response> {
  let baseUrl: URL;
  let upstreamUrl: URL;

  try {
    baseUrl = getLaravelBaseUrl();
    upstreamUrl = makeUpstreamUrl(request, baseUrl);
  } catch {
    return Response.json(
      { message: "O proxy do Laravel não está configurado para esta rota." },
      { status: 500 },
    );
  }

  const requestHeaders = new Headers();

  for (const headerName of FORWARDED_REQUEST_HEADERS) {
    const headerValue = request.headers.get(headerName);

    if (headerValue !== null) {
      requestHeaders.set(headerName, headerValue);
    }
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers: requestHeaders,
    redirect: "manual",
  };

  if (hasBody && request.body !== null) {
    init.body = request.body;
    init.duplex = "half";
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, init);

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: copyResponseHeaders(upstreamResponse, baseUrl),
    });
  } catch {
    return Response.json(
      { message: "Não foi possível encaminhar a requisição ao Laravel." },
      { status: 502 },
    );
  }
}
