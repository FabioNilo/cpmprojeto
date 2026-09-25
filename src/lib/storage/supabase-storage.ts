import "server-only";

const RAW_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "anexos-disciplina";

export class StorageNaoConfigurado extends Error {
  constructor() {
    super(
      "Object storage nao configurado: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.",
    );
    this.name = "StorageNaoConfigurado";
  }
}

export function storageConfigurado(): boolean {
  return Boolean(RAW_URL && SERVICE_KEY);
}

function base() {
  if (!RAW_URL || !SERVICE_KEY) {
    throw new StorageNaoConfigurado();
  }
  return { url: RAW_URL.replace(/\/$/, ""), key: SERVICE_KEY };
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function uploadObjeto(
  path: string,
  data: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const { url, key } = base();
  const res = await fetch(
    `${url}/storage/v1/object/${BUCKET}/${encodePath(path)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: new Blob([data], { type: contentType }),
    },
  );
  if (!res.ok) {
    throw new Error(`Upload para o storage falhou (${res.status}).`);
  }
}

export async function urlAssinada(
  path: string,
  expiraSegundos = 120,
): Promise<string> {
  const { url, key } = base();
  const res = await fetch(
    `${url}/storage/v1/object/sign/${BUCKET}/${encodePath(path)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: expiraSegundos }),
    },
  );
  if (!res.ok) {
    throw new Error(`Não foi possível assinar o download (${res.status}).`);
  }
  const data = (await res.json()) as { signedURL: string };
  return `${url}/storage/v1${data.signedURL}`;
}

export async function removerObjeto(path: string): Promise<void> {
  const { url, key } = base();
  const res = await fetch(
    `${url}/storage/v1/object/${BUCKET}/${encodePath(path)}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${key}` } },
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`Não foi possível remover o objeto (${res.status}).`);
  }
}
