import { proxyLaravelRequest } from "../server/laravelProxy";

export function POST(request: Request): Promise<Response> {
  return proxyLaravelRequest(request);
}
