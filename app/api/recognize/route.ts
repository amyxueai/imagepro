"use server";

import { NextRequest } from "next/server";

const ARK_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
const MODEL_ID = "ep-20250921140145-v9tg9";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "服务器缺少 ARK_API_KEY 配置" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image_file");
    const prompt = formData.get("prompt")?.toString() ?? "识别图片";

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "请上传图片文件" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: "图片大小需小于 10MB" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/png";
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const payload = {
      model: MODEL_ID,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
    };

    const arkResponse = await fetch(ARK_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await arkResponse.text();
    if (!arkResponse.ok) {
      return new Response(text || JSON.stringify({ error: "识别服务调用失败" }), {
        status: arkResponse.status,
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
