"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const formatSize = (bytes: number | null) => {
  if (!bytes) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const tips = [
  "上传 PNG / JPG / WebP，支持透明图层",
  "主体越清晰、背景越单一，效果越好",
  "可以多次去背景比较不同结果",
  "若图片超过 10MB，请先压缩后再尝试",
  "透明背景图可直接用于电商海报",
];

export default function RemoveBackgroundPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [resultPreview, setResultPreview] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (resultPreview) URL.revokeObjectURL(resultPreview);
    },
    [resultPreview],
  );

  const handleSelectFile = (image: File | null) => {
    if (!image) return;
    if (!SUPPORTED_TYPES.includes(image.type)) {
      setError("仅支持 JPG / PNG / WebP 格式");
      return;
    }
    if (image.size > MAX_FILE_SIZE) {
      setError("图片大小需小于 10MB");
      return;
    }
    setError(null);
    setFile(image);
    setOriginalSize(image.size);
    setResultPreview(null);
    setResultBlob(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        if (originalPreview) URL.revokeObjectURL(originalPreview);
        setOriginalPreview(reader.result);
      }
    };
    reader.readAsDataURL(image);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleSelectFile(event.target.files?.[0] ?? null);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    handleSelectFile(event.dataTransfer.files?.[0] ?? null);
  };

  const startRemoveBg = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image_file", file);
      formData.append("size", "auto");
      const response = await fetch("/api/remove-bg", { method: "POST", body: formData });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "调用去背景接口失败" }));
        throw new Error(payload.error || "去背景失败，请稍后再试");
      }
      const blob = await response.blob();
      if (resultPreview) URL.revokeObjectURL(resultPreview);
      const previewUrl = URL.createObjectURL(blob);
      setResultPreview(previewUrl);
      setResultBlob(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "去背景失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const tempUrl = URL.createObjectURL(resultBlob);
    const link = document.createElement("a");
    link.href = tempUrl;
    link.download = `${file.name.replace(/\.[^.]+$/, "")}-no-bg.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(tempUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-violet-50 px-4 py-10">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="text-sm text-sky-500">
          <Link href="/" className="inline-flex items-center gap-2 font-medium hover:text-sky-600">
            <span aria-hidden="true">←</span> 返回首页
          </Link>
        </div>

        <section className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-sky-400">ImagePro</p>
          <h1 className="mt-2 text-4xl font-bold text-zinc-900">抠图去背景</h1>
          <p className="mt-4 text-base text-zinc-500">
            AI 智能识别主体，一键删除背景，快速制作透明 PNG
          </p>
        </section>

        <section className="rounded-[32px] bg-white/95 p-8 shadow-[0_30px_60px_rgba(15,23,42,0.08)]">
          <label
            htmlFor="remove-bg-uploader"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="flex cursor-pointer flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-purple-100 bg-purple-50/40 px-6 py-10 text-center text-zinc-500 transition hover:border-purple-200 hover:bg-white"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-inner">
              ✂️
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-800">拖拽图片到这里或点击选择</p>
              <p className="text-sm text-zinc-500">支持 JPG、PNG、WebP 格式，最大 10MB</p>
            </div>
            <div className="flex gap-3 text-xs font-semibold">
              {["人物", "产品", "图标"].map((badge) => (
                <span key={badge} className="rounded-full bg-white/60 px-3 py-1 text-purple-500 shadow">
                  {badge}
                </span>
              ))}
            </div>
            <input
              id="remove-bg-uploader"
              type="file"
              accept={SUPPORTED_TYPES.join(",")}
              ref={inputRef}
              className="hidden"
              onChange={onFileChange}
            />
          </label>

          {file && (
            <div className="mt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-4 rounded-2xl bg-zinc-50/80 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-zinc-500">当前图片</p>
                  <p className="text-lg font-semibold text-zinc-900">{file.name}</p>
                  <p className="text-sm text-zinc-500">{formatSize(originalSize)}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={startRemoveBg}
                    disabled={isProcessing}
                    className="rounded-full bg-purple-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:bg-purple-600 disabled:cursor-not-allowed disabled:bg-purple-300"
                  >
                    {isProcessing ? "处理中..." : "去除背景"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!resultBlob}
                    className="rounded-full border border-zinc-200 px-6 py-2 text-sm font-semibold text-zinc-600 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:text-zinc-300"
                  >
                    保存图片
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 shadow-inner shadow-rose-100">
                  {error}
                </p>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                  <p className="text-sm uppercase tracking-[0.4em] text-zinc-400">原图</p>
                  <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white">
                    {originalPreview ? (
                      <img src={originalPreview} alt="原图" className="max-h-[220px] rounded-lg object-contain" />
                    ) : (
                      <p className="text-sm text-zinc-400">上传图片后预览</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                  <p className="text-sm uppercase tracking-[0.4em] text-zinc-400">去背景</p>
                  <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-[linear-gradient(45deg,#f5f5f5_25%,transparent_25%)] bg-[length:20px_20px]">
                    {resultPreview ? (
                      <img src={resultPreview} alt="去背景" className="max-h-[220px] rounded-lg object-contain" />
                    ) : (
                      <p className="text-sm text-zinc-400">点击“去除背景”查看结果</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-semibold text-zinc-900">使用提示</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-600">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <span className="mt-1 text-purple-500">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
