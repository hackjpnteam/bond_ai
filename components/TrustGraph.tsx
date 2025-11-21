"use client";
import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";

type GraphData = {
  nodes: { id: string; label: string; type: "user" | "company"; score: number; img?: string }[];
  edges: { id: string; source: string; target: string; weight: number; sentiment: number; confidence: number; tags: string[] }[];
};

function sentimentColor(v: number) {
  if (v >= 0.4) return "#16a34a";
  if (v <= -0.4) return "#dc2626";
  return "#6b7280";
}

export default function TrustGraph({ data, centerEntity }: { data: GraphData; centerEntity?: string }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const initializeGraph = (container: HTMLDivElement) => {
    if (!data || !data.nodes || !data.edges) {
      console.log('No data available:', data);
      return;
    }
    
    console.log('Initializing graph with data:', data);
    console.log('Center entity:', centerEntity);

    try {
      const elements = [
        ...data.nodes.map(n => ({ data: { id: n.id, label: n.label, type: n.type, score: n.score, img: n.img } })),
        ...data.edges.map(e => ({ data: { id: e.id, source: e.source, target: e.target, weight: e.weight, sentiment: e.sentiment, confidence: e.confidence, tags: e.tags } }))
      ];

      const cy = cytoscape({
        container: container,
        elements,
        layout: { 
          name: "concentric",
          concentric: (ele: any) => {
            // 中央エンティティを最も内側の円に配置
            if (centerEntity && ele.data("id") === centerEntity) {
              return 10;
            }
            // 中央エンティティと直接つながっているノードを次の円に
            const isConnected = data.edges.some(edge => 
              (edge.source === centerEntity && edge.target === ele.data("id")) ||
              (edge.target === centerEntity && edge.source === ele.data("id"))
            );
            return isConnected ? 5 : 1;
          },
          levelWidth: () => 2,
          padding: 80,
          minNodeSpacing: 80,
          animate: false // カスタムアニメーションを使うためfalse
        },
        style: [
          {
            selector: "node",
            style: {
              "background-color": (ele: any) => {
                // 中央エンティティを特別な色で強調
                if (centerEntity && ele.data("id") === centerEntity) {
                  return "#FF5E9E"; // Bond Pink で中央を強調
                }
                return ele.data("type") === "company" ? "#3B82F6" : "#A855F7";
              },
              "width": (ele: any) => {
                // 中央エンティティを大きく表示
                const baseSize = centerEntity && ele.data("id") === centerEntity ? 50 : 30;
                return baseSize + (ele.data("score") ?? 3) * 8;
              },
              "height": (ele: any) => {
                const baseSize = centerEntity && ele.data("id") === centerEntity ? 50 : 30;
                return baseSize + (ele.data("score") ?? 3) * 8;
              },
              "label": "data(label)",
              "font-size": (ele: any) => centerEntity && ele.data("id") === centerEntity ? "16px" : "14px",
              "font-weight": (ele: any) => centerEntity && ele.data("id") === centerEntity ? "bold" : "normal",
              "color": "#111",
              "text-background-color": "#fff",
              "text-background-opacity": 0.9,
              "text-background-shape": "roundrectangle",
              "text-margin-y": 5,
              "border-width": (ele: any) => centerEntity && ele.data("id") === centerEntity ? 4 : 0,
              "border-color": "#FF5E9E"
            }
          },
          {
            selector: "edge",
            style: {
              "curve-style": "bezier",
              "width": (ele: any) => 2 + (ele.data("weight") ?? 0.5) * 4,
              "line-color": (ele: any) => sentimentColor(ele.data("sentiment") ?? 0),
              "target-arrow-shape": "triangle",
              "target-arrow-color": (ele: any) => sentimentColor(ele.data("sentiment") ?? 0),
              "opacity": (ele: any) => 0.6 + (ele.data("confidence") ?? 0.5) * 0.4
            }
          },
          { 
            selector: ".highlighted", 
            style: { 
              "line-color": "#FF5E9E", 
              "target-arrow-color": "#FF5E9E", 
              "width": 8, 
              "opacity": 1 
            } 
          }
        ]
      });

      cy.on("tap", "edge", (e: any) => {
        const d = e.target.data();
        const msg = `口コミ: ${d.source} → ${d.target}\nweight: ${d.weight}\nsentiment: ${d.sentiment}\nconfidence: ${d.confidence}\ntags: ${(d.tags||[]).join(", ")}`;
        alert(msg);
      });

      // カスタム出現アニメーション
      const animateGraphAppearance = () => {
        // 最初に全てのノードとエッジを透明にする
        cy.nodes().style('opacity', 0);
        cy.edges().style('opacity', 0);
        
        // 中央ノードから始める
        if (centerEntity) {
          const centerNode = cy.$(`#${centerEntity}`);
          centerNode.animate({
            style: { opacity: 1 }
          }, {
            duration: 300,
            complete: () => {
              // 中央ノードに接続されたエッジとノードを順次表示
              const connectedElements = centerNode.neighborhood();
              let delay = 0;
              
              connectedElements.forEach((ele, index) => {
                setTimeout(() => {
                  ele.animate({
                    style: { opacity: 1 }
                  }, { duration: 300 });
                }, delay);
                delay += 100;
              });
              
              // 残りのノードとエッジを表示
              setTimeout(() => {
                cy.elements().animate({
                  style: { opacity: 1 }
                }, { duration: 500 });
              }, delay + 200);
            }
          });
        } else {
          // 中央ノードがない場合は通常のアニメーション
          cy.elements().animate({
            style: { opacity: 1 }
          }, { duration: 1000 });
        }
      };

      // アニメーション実行
      setTimeout(animateGraphAppearance, 100);

      // 最短紹介ルート
      (window as any).findPath = (from: string, to: string) => {
        try {
          const dijkstra = cy.elements().dijkstra(`#${from}`, (e: any) => 1 / (e.data("weight") || 0.1));
          const path = dijkstra.pathTo(cy.$(`#${to}`));
          cy.$("edge").removeClass("highlighted");
          path.addClass("highlighted");
          cy.animate({ fit: { eles: path, padding: 60 } }, { duration: 500 });
          return path;
        } catch (error) {
          console.warn('Path finding error:', error);
        }
      };

      return cy;
    } catch (error) {
      console.error('Error initializing cytoscape:', error);
      container.innerHTML = '<div class="flex items-center justify-center h-full text-red-500">グラフの初期化に失敗しました</div>';
    }
  };

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isClient || !ref.current || !data) return;

    const cy = initializeGraph(ref.current);
    
    return () => {
      try {
        cy?.destroy();
      } catch (e) {
        console.warn('Error destroying cytoscape instance:', e);
      }
    };
  }, [isClient, data, centerEntity]);

  if (!isClient) {
    return (
      <div className="w-full h-[72vh] rounded-2xl shadow border border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bond-pink"></div>
      </div>
    );
  }

  return <div className="w-full h-[72vh] rounded-2xl shadow border border-gray-200" ref={ref} />;
}