"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type Dimensions = {
  width: number;
  height: number;
};

const formatSize = (bytes: number | null) => {
  if (bytes === null || bytes === undefined) {
    return "--";
  }
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const dataUrlToBlob = (dataUrl: string) => {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = /data:(.*?);/.exec(header);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = atob(base64);
  const length = binary.length;
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
};

const compressFile = (file: File, quality: number) =>
  new Promise<{ blob: Blob }>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("无法创建画布上下文"));
        return;
      }
      ctx.drawImage(image, 0, 0);
      URL.revokeObjectURL(url);
      const outputType =
        file.type === "image/png"
          ? "image/png"
          : file.type === "image/webp"
          ? "image/webp"
          : "image/jpeg";
      const encodedQuality = outputType === "image/png" ? undefined : quality;
      const dataUrl = canvas.toDataURL(outputType, encodedQuality);
      resolve({ blob: dataUrlToBlob(dataUrl) });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("读取图片失败"));
    };
    image.src = url;
  });

const tips = [
  "网页用图推荐 70%-80% 质量，平衡清晰度与体积",
  "社交媒体推荐 60%-70% 质量，提升上传速度",
  "存档备份建议 85%-95% 质量，保留更多细节",
  "大文件可逐步降低质量观察效果",
  "PNG 场景在较低质量下压缩效果有限",
];

const featurePoints = [
  "支持 JPG、PNG、WebP 等主流格式",
  "智能保持图片宽高比例",
  "高质量压缩算法，避免明显失真",
  "实时预览压缩结果与统计信息",
  "保留本地处理，图片不上传服务器",
];

const badgeColors = ["bg-sky-100 text-sky-600", "bg-emerald-100 text-emerald-600", "bg-purple-100 text-purple-600"];

function PreviewCard({
  title,
  image,
  size,
  dimensions,
  hint,
}: {
  title: string;
  image: string | null;
  size: number | null;
  dimensions: Dimensions | null;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div>
        <p className="text-sm uppercase tracking-[0.4em] text-zinc-400">{title}</p>
        <p className="text-lg font-semibold text-zinc-900">{image ? formatSize(size) : "--"}</p>
        {dimensions && image ? (
          <p className="text-sm text-zinc-500">
            {dimensions.width} × {dimensions.height}px
          </p>
        ) : (
          <p className="text-sm text-zinc-400">{hint}</p>
        )}
      </div>
      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50">
        {image ? (
          <img src={image} alt={title} className="max-h-[200px] rounded-lg object-contain" />
        ) : (
          <p className="text-sm text-zinc-400">{hint}</p>
        )}
      </div>
    </div>
  );
}

export default function CompressPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [quality, setQuality] = useState(80);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectFile = (file: File | null) => {
    if (!file) return;
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setError("仅支持 JPG / PNG / WebP 格式");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("图片大小需小于 10MB");
      return;
    }
    setError(null);
    setSelectedFile(file);
    setOriginalSize(file.size);
    setCompressedPreview(null);
    setCompressedBlob(null);
    setCompressedSize(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setOriginalPreview(result);
      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.width, height: img.height });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleSelectFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0] ?? null;
    handleSelectFile(file);
  };

  const handleCompress = async () => {
    if (!selectedFile) return;
    setIsCompressing(true);
    try {
      const { blob } = await compressFile(selectedFile, quality / 100);
      setCompressedSize(blob.size);
      if (compressedPreview) {
        URL.revokeObjectURL(compressedPreview);
      }
      const previewUrl = URL.createObjectURL(blob);
      setCompressedPreview(previewUrl);
      setCompressedBlob(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "压缩失败，请重试");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob || !selectedFile) return;
    const extension = selectedFile.type.split("/")[1] ?? "jpg";
    const tempUrl = URL.createObjectURL(compressedBlob);
    const link = document.createElement("a");
    link.href = tempUrl;
    link.download = `compressed-${selectedFile.name.replace(/\.[^.]+$/, "")}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(tempUrl);
  };

  const savedPct =
    originalSize && compressedSize ? Math.max(0, 100 - (compressedSize / originalSize) * 100).toFixed(1) : null;

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
          <h1 className="mt-2 text-4xl font-bold text-zinc-900">图片压缩工具</h1>
          <p className="mt-4 text-base text-zinc-500">
            智能压缩图片文件大小，保持高清质量的同时显著减少存储空间
          </p>
        </section>

        <section className="rounded-[32px] bg-white/90 p-8 shadow-[0_30px_60px_rgba(15,23,42,0.08)]">
          <label
            htmlFor="image-uploader"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="flex cursor-pointer flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-sky-100 bg-sky-50/50 px-6 py-10 text-center text-zinc-500 transition hover:border-sky-200 hover:bg-white"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-inner">
              ☁️
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-800">拖拽图片到这里或点击选择</p>
              <p className="text-sm text-zinc-500">支持 JPG、PNG、WebP 格式，最大 10MB</p>
            </div>
            <div className="flex gap-3 text-xs font-semibold">
              {["JPG", "PNG", "WebP"].map((badge, index) => (
                <span key={badge} className={`rounded-full px-3 py-1 ${badgeColors[index % badgeColors.length]}`}>
                  {badge}
                </span>
              ))}
            </div>
            <input
              id="image-uploader"
              type="file"
              accept={SUPPORTED_TYPES.join(",")}
              className="hidden"
              ref={inputRef}
              onChange={onFileInputChange}
            />
          </label>

          {originalPreview && (
            <div className="mt-8 flex flex-col gap-6">
              <div className="flex flex-col gap-4 rounded-2xl bg-zinc-50/80 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-zinc-500">压缩百分比</p>
                  <p className="text-2xl font-semibold text-zinc-900">{quality}%</p>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <input
                    type="range"
                    min={40}
                    max={100}
                    step={5}
                    value={quality}
                    onChange={(event) => setQuality(Number(event.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200"
                  />
                  <p className="text-xs text-zinc-500">向左拖拽可进一步压缩体积，向右提升画质</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCompress}
                    disabled={isCompressing}
                    className="rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-sky-300"
                  >
                    {isCompressing ? "压缩中..." : "开始压缩"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!compressedBlob}
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
                <PreviewCard
                  title="原图"
                  image={originalPreview}
                  size={originalSize}
                  dimensions={dimensions}
                  hint="上传图片后即可预览"
                />
                <PreviewCard
                  title="压缩图"
                  image={compressedPreview}
                  size={compressedSize}
                  dimensions={dimensions}
                  hint="点击“开始压缩”生成结果"
                />
              </div>

              {savedPct && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-6 py-4 text-sm text-emerald-700">
                  预计为您节省 {savedPct}% 的体积，压缩后大小 {formatSize(compressedSize)}（原图 {formatSize(
                    originalSize
                  )}）。
                </div>
              )}
            </div>
          )}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-semibold text-zinc-900">功能特点</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-600">
              {featurePoints.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-1 text-sky-500">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-3xl bg-emerald-50/80 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-semibold text-emerald-900">使用建议</h2>
            <ul className="mt-4 space-y-3 text-sm text-emerald-700">
              {tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}
