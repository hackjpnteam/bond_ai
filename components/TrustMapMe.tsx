"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { NodeObject, LinkObject } from "react-force-graph-2d";
import { useRouter } from "next/navigation";

type N = NodeObject & {
  id: string;
  type: "person" | "company";
  label: string;
  img?: string;
  size: number;
  slug?: string;
  fx?: number;
  fy?: number;
  meta?: any;
  isMe?: boolean; // 自分のノードかどうか
};
type L = LinkObject & { source: string | N; target: string | N; weight: number };

export default function TrustMapMe() {
  const [data, setData] = useState<{ nodes: N[]; links: L[] }>({ nodes: [], links: [] });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const fgRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/trust-map/me")
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setData)
      .catch(() => setError("サインインしてください。"));
  }, []);

  const images = useMemo(() => {
    const map = new Map<string, HTMLImageElement>();
    data.nodes.forEach(n => {
      if (!n.img) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = n.img;
      img.onerror = () => map.delete(n.id); // 404はフォールバック塗りへ
      map.set(n.id, img);
    });
    return map;
  }, [data.nodes]);

  if (error) {
    return <div className="p-4 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="w-full h-[640px] rounded-2xl border bg-transparent">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        backgroundColor="rgba(0,0,0,0)"
        nodeRelSize={4}
        linkColor={() => "#999999"}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkWidth={(l: any) => Math.max(0.5, l.weight || 1)}
        cooldownTicks={100}
        onEngineStop={() => {
          // 初回は自分(中心)が見切れないよう少しズーム
          if (!fgRef.current) return;
          fgRef.current.zoomToFit(400, 50);
        }}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const n = node as N;
          const size = n.size ?? 12;
          const img = images.get(n.id);

          // 自分のノードにはハイライトリングを描画
          if (n.isMe) {
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, size + 4, 0, Math.PI * 2, false);
            ctx.strokeStyle = "#FF5E9E"; // ボンドピンク
            ctx.lineWidth = 3;
            ctx.stroke();
          }

          // 丸くクリップして画像 or 塗り
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, size, 0, Math.PI * 2, false);
          ctx.closePath();
          ctx.clip();

          if (img) {
            ctx.drawImage(img, node.x! - size, node.y! - size, size * 2, size * 2);
          } else {
            ctx.fillStyle = n.type === "company" ? "#FF5E9E" : "#7EA8FF"; // サイトカラーに合わせてOK
            ctx.fill();
          }
          ctx.restore();

          // ラベル（自分のノードは常に表示、他は拡大時のみ）
          if (n.isMe || globalScale > 1.1) {
            const fontSize = n.isMe ? Math.max(12, 14 / globalScale) : Math.max(10, 12 / globalScale);
            ctx.font = n.isMe ? `bold ${fontSize}px sans-serif` : `${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.fillStyle = n.isMe ? "#FF5E9E" : "#333";
            const label = n.label ?? "";
            ctx.fillText(label, node.x!, node.y! + size + 12);
          }
        }}
        onNodeClick={(node: any) => {
          const n = node as N;
          if (n.type === "company" && n.slug) {
            router.push(`/company/${n.slug}`);
          }
        }}
      />
    </div>
  );
}