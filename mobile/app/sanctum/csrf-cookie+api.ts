import { proxyLaravelRequest } from "../../server/laravelProxy";

export function GET(request: Request): Promise<Response> {
  return proxyLaravelRequest(request);
}
