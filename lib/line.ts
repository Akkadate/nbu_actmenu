import axios from "axios";

const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

if (!lineToken) {
  throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not set");
}

const lineApi = axios.create({
  baseURL: "https://api.line.me/v2/bot",
  headers: {
    Authorization: `Bearer ${lineToken}`,
  },
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function retry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === retries) {
        break;
      }

      const delay = 300 * 2 ** attempt;
      await wait(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("LINE request failed");
}

export async function setRichMenu(userId: string, richMenuId: string): Promise<void> {
  await retry(async () => {
    await lineApi.post(`/user/${encodeURIComponent(userId)}/richmenu/${encodeURIComponent(richMenuId)}`, {});
  });
}

export async function pushFlex(userId: string, flexPayload: unknown): Promise<void> {
  await retry(async () => {
    await lineApi.post("/message/push", {
      to: userId,
      messages: [
        {
          type: "flex",
          altText: "Activity Information",
          contents: flexPayload,
        },
      ],
    });
  });
}