import { headers } from "next/headers";

export type RequestMetadata = {
  ip?: string;
  userAgent?: string;
};

export async function getRequestMetadata(): Promise<RequestMetadata> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");

  return {
    ip: forwardedFor?.split(",")[0]?.trim() ?? realIp ?? undefined,
    userAgent: headersList.get("user-agent") ?? undefined,
  };
}
