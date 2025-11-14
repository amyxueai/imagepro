"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const infoCards = [
  {
    title: "物体识别",
    description: "识别图片中的人物、物体、颜色等特征标签",
    accent: "from-sky-50 to-white",
  },
  {
    title: "场景分析",
    description: "分析拍摄场景、环境，提取多维描述信息",
    accent: "from-purple-50 to-white",
  },
  {
    title: "内容理解",
    description: "理解图片中丰富内容，提供详细的逻辑推理",
    accent: "from-emerald-50 to-white",
  },
];

const featureHighlights = [
  "多模态识别：图像 + 文本联合理解",
  "支持 JPG / PNG / WebP 上传",
  "智能生成结构化描述结果",
  "适配商品详情、内容审核等场景",
  "提供原始 JSON 响应便于二次处理",
];

const formatSize = (bytes: number | null) => {
  if (bytes === null || bytes === undefined) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const parseSummary = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as {
    choices?: Array<{
      message?: {
        content?:
          | string
          | Array<{
              type: string;
              text?: string;
            }>;
      };
    }>;
  };

  const firstChoice = data.choices?.[0];
  if (!firstChoice?.message?.content) return "";
  const content = firstChoice.message.content;
  if (typeof content === "string") return content;
  return content
    .filter((chunk) => chunk.type === "text" && chunk.text)
    .map((chunk) => chunk.text?.trim())
    .filter(Boolean)
    .join("\n");
};

export default function RecognitionPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [rawJson, setRawJson] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = (image: File | null) => {
    if (!image) return;
    if (!SUPPORTED_TYPES.includes(image.type)) {
      setError("仅支持 JPG / PNG / WebP 格式");
      return;
    }
    if (image.size > MAX_FILE_SIZE) {
      setError("图片大小需小于 10MB");
      return;
    }
    setFile(image);
    setError(null);
    setResult("");
    setRawJson("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreview(reader.result);
      }
    };
    reader.readAsDataURL(image);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0] ?? null);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    handleFile(event.dataTransfer.files?.[0] ?? null);
  };

  const clearSelection = () => {
    setFile(null);
    setPreview(null);
    setResult("");
    setRawJson("");
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const startRecognition = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image_file", file);
      formData.append("prompt", "识别图片内容并提供结构化描述");
      const response = await fetch("/api/recognize", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) {
        let apiMessage: string | null = null;
        if (payload && typeof payload === "object") {
          if ("error" in payload && typeof (payload as { error?: string | { message?: string } }).error === "string") {
            apiMessage = (payload as { error: string }).error;
          } else if (
            "error" in payload &&
            typeof (payload as { error?: { message?: string } }).error === "object" &&
            (payload as { error?: { message?: string } }).error?.message
          ) {
            apiMessage = (payload as { error?: { message?: string } }).error?.message || null;
          } else {
            apiMessage = JSON.stringify(payload);
          }
          if ("code" in payload && typeof payload.code === "string") {
            apiMessage = `${apiMessage ?? ""}\n(code: ${payload.code})`;
          }
          if ("target" in payload && typeof payload.target === "string") {
            apiMessage = `${apiMessage ?? ""}\nendpoint: ${payload.target}`;
          }
        }
        throw new Error(apiMessage || "识别失败，请稍后重试");
      }
      setRawJson(JSON.stringify(payload, null, 2));
      const summary = parseSummary(payload);
      setResult(summary || "识别成功，但未返回文本描述。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "识别失败，请稍后再试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-pink-50 px-4 py-10">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="text-sm text-violet-500">
          <Link href="/" className="inline-flex items-center gap-2 font-medium hover:text-violet-600">
            <span aria-hidden="true">←</span> 返回首页
          </Link>
        </div>

        <section className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-violet-400">ImagePro</p>
          <h1 className="mt-2 text-4xl font-bold text-zinc-900">图片识别</h1>
          <p className="mt-4 text-base text-zinc-500">AI 智能分析图像内容，识别物体、文字、场景等信息</p>
        </section>

        <section className="rounded-[32px] bg-white/95 p-8 shadow-[0_30px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-6 md:grid-cols-2">
            <label
              htmlFor="recognition-upload"
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop}
              className="flex cursor-pointer flex-col gap-4 rounded-3xl border-2 border-dashed border-violet-100 bg-violet-50/40 p-6 text-zinc-500 transition hover:border-violet-200 hover:bg-white"
            >
              <p className="text-lg font-semibold text-zinc-800">待识别图片</p>
              <div className="flex flex-1 items-center justify-center rounded-2xl bg-white text-zinc-500 shadow-inner">
                {preview ? (
                  <img src={preview} alt="待识别图片" className="max-h-[260px] rounded-xl object-contain" />
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-zinc-500">拖拽图片到这里或点击上传</p>
                    <p className="text-xs text-zinc-400">支持 JPG、PNG、WebP，最大 10MB</p>
                  </div>
                )}
              </div>
              {file && (
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-zinc-500 shadow">
                  <p className="font-medium text-zinc-700">{file.name}</p>
                  <p className="text-xs text-zinc-400">
                    大小：{formatSize(file.size)} · 类型：{file.type || "未知"}
                  </p>
                </div>
              )}
              <input
                id="recognition-upload"
                type="file"
                accept={SUPPORTED_TYPES.join(",")}
                className="hidden"
                ref={inputRef}
                onChange={onFileChange}
              />
            </label>

            <div className="flex flex-col gap-4 rounded-3xl border border-zinc-100 bg-white/80 p-6">
              <p className="text-lg font-semibold text-zinc-800">识别结果</p>
              <div className="min-h-[220px] rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-500">
                {isLoading && <p className="text-violet-500">正在识别，请稍候...</p>}
                {!isLoading && result && <p className="whitespace-pre-wrap text-zinc-700">{result}</p>}
                {!isLoading && !result && <p className="text-zinc-400">上传图片并点击“开始识别”查看结果</p>}
              </div>
              {error && (
                <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-600 shadow-inner shadow-rose-100">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={startRecognition}
                  disabled={!file || isLoading}
                  className="rounded-full bg-violet-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-violet-300"
                >
                  {isLoading ? "识别中..." : "开始识别"}
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-full border border-zinc-200 px-6 py-2 text-sm font-semibold text-zinc-600 transition hover:border-zinc-400"
                >
                  重新选择
                </button>
              </div>
              {rawJson && (
                <details className="rounded-2xl bg-zinc-900/90 p-4 text-sm text-zinc-100">
                  <summary className="cursor-pointer text-sm font-medium">查看原始响应</summary>
                  <pre className="mt-3 max-h-64 overflow-auto text-xs text-emerald-100">{rawJson}</pre>
                </details>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {infoCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-3xl bg-gradient-to-br ${card.accent} p-5 shadow-[0_15px_40px_rgba(15,23,42,0.05)]`}
            >
              <h3 className="text-lg font-semibold text-zinc-800">{card.title}</h3>
              <p className="mt-2 text-sm text-zinc-500">{card.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl bg-amber-50/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-semibold text-amber-900">功能说明</h2>
          <ul className="mt-4 space-y-2 text-sm text-amber-900/80">
            {featureHighlights.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
