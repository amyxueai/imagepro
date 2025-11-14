import Link from "next/link";

type Feature = {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  href?: string;
};

const features: Feature[] = [
  {
    id: "compress",
    title: "图片压缩",
    description: "智能压缩图片文件大小，保持高质量的同时减少存储空间。",
    icon: "🗜️",
    accent: "from-sky-300 to-sky-500",
    href: "/compress",
  },
  {
    id: "remove-bg",
    title: "抠图去背景",
    description: "AI 智能识别主体，一键去除图片背景，制作透明背景图片。",
    icon: "🎯",
    accent: "from-emerald-300 to-emerald-500",
    href: "/remove-bg",
  },
  {
    id: "recognition",
    title: "图片识别",
    description: "AI 分析图片内容，识别物体、文字、场景等信息。",
    icon: "👁️",
    accent: "from-purple-300 to-purple-500",
    href: "/recognition",
  },
  {
    id: "ai-gen",
    title: "AI 生图",
    description: "通过文字描述生成高质量图片，释放创意无限可能。",
    icon: "✨",
    accent: "from-amber-300 to-amber-500",
    href: "/ai-gen",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-violet-50 px-4 py-16">
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-12">
        <section className="text-center">
          <h1 className="text-4xl font-bold text-zinc-900 md:text-[44px]">图片处理工具</h1>
          <p className="mt-4 text-lg text-zinc-500">专业的图片处理平台，提供图片压缩、抠图去背景、图片识别和 AI 生图等功能。</p>
        </section>

        <section className="grid w-full gap-6 md:grid-cols-2">
          {features.map((feature) => {
            const Card = (
              <article
                className="flex h-full flex-col gap-4 rounded-3xl bg-white p-8 text-center shadow-[0_30px_60px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_40px_80px_rgba(15,23,42,0.12)]"
              >
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${feature.accent} text-2xl`}
                >
                  <span role="img" aria-label={feature.title}>
                    {feature.icon}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold text-zinc-900">{feature.title}</h3>
                <p className="text-sm leading-6 text-zinc-500">{feature.description}</p>
              </article>
            );

            return feature.href ? (
              <Link
                key={feature.id}
                href={feature.href}
                className="block text-current no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500"
              >
                {Card}
              </Link>
            ) : (
              <div key={feature.id}>{Card}</div>
            );
          })}
        </section>

        <p className="text-sm text-zinc-400">选择一个功能开始处理您的图片</p>
      </main>
    </div>
  );
}
