"use server";

import { NextRequest } from "next/server";

const ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const MODEL_ID = "ep-20250922151247-nzclw";

type Payload = {
  prompt?: string;
  size?: string;
  watermark?: boolean;
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "服务器缺少 ARK_API_KEY 配置" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "无效的请求体" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return new Response(JSON.stringify({ error: "请填写提示词" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const size = body.size || "1024x1024";
  const watermark = body.watermark ?? true;

  const payload = {
    model: MODEL_ID,
    prompt,
    sequential_image_generation: "disabled",
    response_format: "url",
    size,
    stream: false,
    watermark,
  };

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    if (!response.ok) {
      return new Response(text || JSON.stringify({ error: "生成失败" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
