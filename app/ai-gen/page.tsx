"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const sizeOptions = [
  { label: "正方形 1024", value: "1024x1024" },
  { label: "横向 1280×720", value: "1280x720" },
  { label: "高清 2K", value: "2K" },
];

const promptPresets = [
  "超写实肖像，侧光，菲林质感，暖色调，虚化背景",
  "潮流产品海报，玻璃反射，霓虹灯，蓝橙配色，8K",
  "童话森林，精灵，薄雾晨光，柔和色彩，电影级构图",
];

const featureHighlights = [
  "多风格提示词支持，随时探索创意灵感",
  "可选 2K 输出，满足高分辨率需求",
  "生成记录仅存储在本地，保障素材安全",
  "支持关闭水印（由平台保留最终决定权）",
];

type ArkImageResponse = {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  id?: string;
  created?: number;
  error?: { message: string };
};

const extractImageUrl = (payload: ArkImageResponse) => {
  const first = payload.data?.[0];
  if (!first) return null;
  if (first.url) return first.url;
  if (first.b64_json) return `data:image/png;base64,${first.b64_json}`;
  return null;
};

export default function AiGenPage() {
  const [prompt, setPrompt] = useState(
    "星际穿越，黑洞喷射，复古列车冲出黑洞，高对比光影，电影级质感，动态模糊，夸张广角",
  );
  const [size, setSize] = useState(sizeOptions[0].value);
  const [watermark, setWatermark] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ id?: string; created?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("请先输入提示词");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setImageUrl(null);
    setMeta(null);

    try {
      const response = await fetch("/api/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, size, watermark }),
      });
      const payload = (await response.json()) as ArkImageResponse;
      if (!response.ok) {
        throw new Error(payload?.error?.message || "生成失败，请稍后再试");
      }
      const url = extractImageUrl(payload);
      if (!url) {
        throw new Error("未获取到图片地址，请重试");
      }
      setImageUrl(url);
      setMeta({ id: payload.id, created: payload.created });
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请稍后再试");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-sky-50 px-4 py-10">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="text-sm text-rose-500">
          <Link href="/" className="inline-flex items-center gap-2 font-medium hover:text-rose-600">
            <span aria-hidden="true">←</span> 返回首页
          </Link>
        </div>

        <section className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-rose-400">ImagePro</p>
          <h1 className="mt-2 text-4xl font-bold text-zinc-900">AI 生图</h1>
          <p className="mt-4 text-base text-zinc-500">输入提示词，调用火山引擎多模态模型，即刻获得高质量视觉创作</p>
        </section>

        <section className="rounded-[32px] bg-white/95 p-8 shadow-[0_30px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-5 rounded-3xl border border-rose-100 bg-rose-50/30 p-6">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-zinc-900">提示词设置</p>
                <button
                  type="button"
                  onClick={() => setPrompt("")}
                  className="text-sm text-rose-500 transition hover:text-rose-600"
                >
                  清空
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="描述你想要的画面、风格、光影..."
                className="min-h-[180px] rounded-2xl border border-rose-100 bg-white p-4 text-sm text-zinc-700 outline-none focus:border-rose-300 focus:ring focus:ring-rose-100"
              />
              <div className="flex flex-wrap gap-2 text-xs">
                {promptPresets.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setPrompt(preset)}
                    className="rounded-full border border-rose-200 px-3 py-1 text-rose-500 transition hover:border-rose-400 hover:text-rose-600"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex flex-1 flex-col gap-2">
                  <label className="text-xs text-zinc-500">输出尺寸</label>
                  <select
                    value={size}
                    onChange={(event) => setSize(event.target.value)}
                    className="rounded-2xl border border-rose-100 bg-white px-4 py-2 text-sm text-zinc-700 outline-none focus:border-rose-300 focus:ring focus:ring-rose-100"
                  >
                    {sizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-white px-4 py-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={watermark}
                    onChange={(event) => setWatermark(event.target.checked)}
                    className="h-4 w-4 rounded border border-rose-200 text-rose-500 focus:ring-rose-400"
                  />
                  保留水印
                </label>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mt-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {isGenerating ? "生成中..." : "开始生成"}
              </button>
            </div>

            <div className="flex flex-col gap-4 rounded-3xl border border-zinc-100 bg-white p-6">
              <p className="text-lg font-semibold text-zinc-900">生成结果</p>
              <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-dashed border-zinc-200 bg-gradient-to-br from-zinc-50 to-white">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="AI 生成图片" className="h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-zinc-400">
                    <Image src="/next.svg" width={60} height={60} alt="placeholder" className="opacity-20" />
                    <p>生成结果将在这里展示</p>
                  </div>
                )}
              </div>
              {meta && (
                <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
                  <p>任务 ID：{meta.id}</p>
                  {meta.created && <p>创建时间：{new Date(meta.created * 1000).toLocaleString()}</p>}
                </div>
              )}
              {error && (
                <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-600 shadow-inner shadow-rose-100">
                  {error}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-semibold text-zinc-900">创作指南</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl bg-rose-50/80 p-4 text-sm text-rose-900/80">
              <h3 className="text-base font-semibold text-rose-900">提示词建议</h3>
              <p className="mt-2 leading-6">
                采用「主体 + 场景 + 光影 + 风格 + 细节」结构描述，尽量使用形容词提升细腻度；加入「镜头、材质、渲染方式」等关键词，可以更精确地控制画面。
              </p>
            </article>
            <article className="rounded-2xl bg-sky-50/80 p-4 text-sm text-sky-900/80">
              <h3 className="text-base font-semibold text-sky-900">生成建议</h3>
              <ul className="mt-2 space-y-2">
                <li>• 2K 图适合做壁纸或大屏展示，生成耗时略长</li>
                <li>• 若提示词较长，请保留核心关键词，避免歧义</li>
                <li>• 如遇审查或内容限制，请调整描述重新生成</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="rounded-3xl bg-amber-50/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-semibold text-amber-900">功能亮点</h2>
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
