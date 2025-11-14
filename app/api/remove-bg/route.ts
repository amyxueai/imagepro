"use server";

import { NextRequest } from "next/server";

const REMOVE_BG_ENDPOINT = "https://api.remove.bg/v1.0/removebg";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "服务器缺少 REMOVE_BG_API_KEY 配置" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image_file");
    const size = formData.get("size")?.toString() ?? "auto";

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

    const proxyForm = new FormData();
    proxyForm.append("image_file", file, file.name || "upload.png");
    proxyForm.append("size", size);

    const removeBgResponse = await fetch(REMOVE_BG_ENDPOINT, {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: proxyForm,
    });

    if (!removeBgResponse.ok) {
      const errorBuffer = await removeBgResponse.arrayBuffer();
      const textDecoder = new TextDecoder();
      const errorText = textDecoder.decode(errorBuffer) || "去背景服务调用失败";
      return new Response(JSON.stringify({ error: errorText }), {
        status: removeBgResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await removeBgResponse.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": removeBgResponse.headers.get("Content-Type") ?? "image/png",
        "Content-Disposition": "inline; filename=no-bg.png",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器内部错误";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
