'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Node {
  id: string;
  displayName?: string;
  reviewCount: number;
  isCenter?: boolean;
  type: 'person' | 'org';
  imageUrl?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  isConnectedUserNode?: boolean; // 繋がりのあるユーザー経由のノードかどうか
}

interface Link {
  source: string | Node;
  target: string | Node;
  strength: number;
  isConnectedUserLink?: boolean; // 繋がりのあるユーザー経由のリンクかどうか
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface BondHeartGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
  centerMode?: 'logo' | 'avatar';
  nodeScale?: number; // ノードサイズの倍率（デフォルト1）
}

const BondHeartGraph: React.FC<BondHeartGraphProps> = ({
  data,
  width = 800,
  height = 600,
  centerMode = 'logo',
  nodeScale = 1
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    content: string;
  }>({ show: false, x: 0, y: 0, content: '' });
  const [animationPhase, setAnimationPhase] = useState<'center' | 'nodes' | 'complete'>('center');
  const [visibleNodeCount, setVisibleNodeCount] = useState(0);
  const animationRef = useRef<number | null>(null);

  // ハート形状のパス生成関数
  const heartPath = (s = 1) => {
    return [
      `M 0,${-15 * s}`,
      `C ${-12 * s},${-25 * s} ${-30 * s},0 0,${25 * s}`,
      `C ${30 * s},0 ${12 * s},${-25 * s} 0,${-15 * s}`,
      "Z"
    ].join(" ");
  };

  // サイズスケール関数（ノードタイプ別）
  const sizeScale = (node: Node) => {
    const safeCount = Number(node.reviewCount) || 0; // undefinedやNaNの場合は0を使用
    const baseSize = 0.8 + 0.2 * Math.sqrt(Math.max(0, safeCount));

    // 人物ノード：大きく表示（1.8倍）
    if (node.type === 'person') {
      return baseSize * 1.8 * nodeScale;
    }
    // 企業ノード：小さく表示（1.0倍）
    else {
      return baseSize * 1.0 * nodeScale;
    }
  };

  // ノード色の取得関数
  const nodeFill = (node: Node) => {
    if (node.isCenter) return '#FF5E9E'; // Bond Pink
    if (node.type === 'org') return '#4A8CFF'; // Bond Blue
    return '#A46BF5'; // Lavender Purple
  };


  // ノードを中心からの角度でソート（時計回り、12時方向から開始）
  const getSortedNonCenterNodes = (nodes: Node[], centerX: number, centerY: number) => {
    const nonCenterNodes = nodes.filter(n => !n.isCenter);
    return nonCenterNodes.sort((a, b) => {
      // 初期位置がない場合はランダムな位置を仮定
      const ax = a.x ?? centerX + (Math.random() - 0.5) * 200;
      const ay = a.y ?? centerY + (Math.random() - 0.5) * 200;
      const bx = b.x ?? centerX + (Math.random() - 0.5) * 200;
      const by = b.y ?? centerY + (Math.random() - 0.5) * 200;

      // 角度を計算（12時方向が0度、時計回り）
      const angleA = Math.atan2(ax - centerX, -(ay - centerY));
      const angleB = Math.atan2(bx - centerX, -(by - centerY));

      return angleA - angleB;
    });
  };

  // アニメーションをリセット
  useEffect(() => {
    setAnimationPhase('center');
    setVisibleNodeCount(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    console.log('=== BondHeartGraph Data ===');
    console.log('Total nodes:', data.nodes.length);
    console.log('Total links:', data.links.length);
    data.nodes.forEach((node, index) => {
      console.log(`Node ${index}:`, {
        id: node.id,
        type: node.type,
        imageUrl: node.imageUrl,
        isCenter: node.isCenter
      });
    });

    // リンクのデバッグログ
    console.log('=== Links Debug ===');
    data.links.forEach((link, index) => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
      const sourceExists = data.nodes.some(n => n.id === sourceId);
      const targetExists = data.nodes.some(n => n.id === targetId);
      console.log(`Link ${index}: ${sourceId} -> ${targetId} (source exists: ${sourceExists}, target exists: ${targetExists})`);
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const centerX = width / 2;
    const centerY = height / 2;

    // defsセクションを作成
    const defs = svg.append('defs');

    // グラデーション定義
    const gradPP = defs.append('linearGradient')
      .attr('id', 'grad-pp')
      .attr('gradientUnits', 'userSpaceOnUse');
    gradPP.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#6C63FF')
      .attr('stop-opacity', 0.9);
    gradPP.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#D8C1FF')
      .attr('stop-opacity', 0.9);

    const gradPC = defs.append('linearGradient')
      .attr('id', 'grad-pc')
      .attr('gradientUnits', 'userSpaceOnUse');
    gradPC.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#FF4E88')
      .attr('stop-opacity', 0.9);
    gradPC.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#FF8FB6')
      .attr('stop-opacity', 0.9);

    // グローフィルター定義
    const glowFilter = defs.append('filter')
      .attr('id', 'edge-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'blur');
    const merge = glowFilter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // マーカー（矢印）の定義
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 5)
      .attr('refY', 0)
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#A3A3A3');

    // 円形クリップパスを定義
    defs.append('clipPath')
      .attr('id', 'circle-clip')
      .append('circle')
      .attr('r', 50) // 固定サイズ、後で動的にスケール
      .attr('cx', 0)
      .attr('cy', 0);

    // 画像ログ出力
    data.nodes.forEach((node, index) => {
      if (node.imageUrl && !node.isCenter) {
        console.log(`Will render image node ${index}:`, node.id, node.imageUrl);
      }
    });

    // リンクグループ
    const linkGroup = svg.append('g').attr('class', 'links');
    
    // ノードグループ
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    // 中心ノードを画面中央に固定
    const centerNode = data.nodes.find(n => n.isCenter);
    data.nodes.forEach((node) => {
      if (node.isCenter) {
        node.fx = centerX;
        node.fy = centerY;
        node.x = centerX;
        node.y = centerY;
      }
    });

    // 非中心ノードを時計回りに配置するための初期位置を設定
    const nonCenterNodes = data.nodes.filter(n => !n.isCenter);
    const angleStep = (2 * Math.PI) / Math.max(nonCenterNodes.length, 1);
    nonCenterNodes.forEach((node, index) => {
      // 12時方向から時計回りに配置
      const angle = -Math.PI / 2 + angleStep * index;
      const radius = 150; // 初期配置の半径
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
    });

    // ソートされたノードリスト（アニメーション用）
    const sortedNonCenterNodes = getSortedNonCenterNodes(data.nodes, centerX, centerY);
    const sortedNodeIds = new Set(sortedNonCenterNodes.map(n => n.id));

    // シミュレーション設定
    const simulation = d3.forceSimulation<Node>(data.nodes)
      .force('link', d3.forceLink<Node, Link>(data.links)
        .id((d: Node) => d.id)
        .distance(100)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: Node) => Math.round((22.5 * sizeScale(d) + 15) * 10) / 10));

    // リンクの描画
    const links = linkGroup
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('opacity', 0) // 最初は非表示
      .each(function(d: Link, i: number) {
        // 各リンクに個別のグラデーションを作成
        const sourceId = typeof d.source === 'string' ? d.source : (d.source as any).id;
        const targetId = typeof d.target === 'string' ? d.target : (d.target as any).id;
        const sourceNode = data.nodes.find((n: Node) => n.id === sourceId);
        const targetNode = data.nodes.find((n: Node) => n.id === targetId);
        const isPersonPerson = sourceNode?.type === 'person' && targetNode?.type === 'person';
        
        const gradId = `grad-${i}`;
        const grad = defs.append('linearGradient')
          .attr('id', gradId)
          .attr('gradientUnits', 'userSpaceOnUse');
        
        if (isPersonPerson) {
          // Electric Indigo グラデーション
          grad.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#6C63FF')
            .attr('stop-opacity', 0.9);
          grad.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#D8C1FF')
            .attr('stop-opacity', 0.9);
        } else {
          // Bond Pink グラデーション
          grad.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#FF4E88')
            .attr('stop-opacity', 0.9);
          grad.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#FF8FB6')
            .attr('stop-opacity', 0.9);
        }
        
        d3.select(this).attr('stroke', `url(#${gradId})`);
      })
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.9)
      .attr('filter', 'url(#edge-glow)')
      .attr('stroke-dasharray', null)
      .attr('marker-end', 'url(#arrowhead)')
      .on('mouseenter', function(event, d, i) {
        const sourceNode = data.nodes.find((n: Node) => n.id === d.source);
        const targetNode = data.nodes.find((n: Node) => n.id === d.target);
        const isPersonPerson = sourceNode?.type === 'person' && targetNode?.type === 'person';
        
        const linkIndex = data.links.indexOf(d);
        const gradId = `grad-${linkIndex}`;
        const grad = defs.select(`#${gradId}`);
        
        if (isPersonPerson) {
          grad.select('stop[offset="0%"]').attr('stop-color', '#8A82FF');
          grad.select('stop[offset="100%"]').attr('stop-color', '#E4D8FF');
        } else {
          grad.select('stop[offset="0%"]').attr('stop-color', '#FF74A5');
          grad.select('stop[offset="100%"]').attr('stop-color', '#FFB2C6');
        }
      })
      .on('mouseleave', function(event, d, i) {
        const sourceNode = data.nodes.find((n: Node) => n.id === d.source);
        const targetNode = data.nodes.find((n: Node) => n.id === d.target);
        const isPersonPerson = sourceNode?.type === 'person' && targetNode?.type === 'person';
        
        const linkIndex = data.links.indexOf(d);
        const gradId = `grad-${linkIndex}`;
        const grad = defs.select(`#${gradId}`);
        
        if (isPersonPerson) {
          grad.select('stop[offset="0%"]').attr('stop-color', '#6C63FF');
          grad.select('stop[offset="100%"]').attr('stop-color', '#D8C1FF');
        } else {
          grad.select('stop[offset="0%"]').attr('stop-color', '#FF4E88');
          grad.select('stop[offset="100%"]').attr('stop-color', '#FF8FB6');
        }
      });

    // ノードグループの作成
    const nodeGroups = nodeGroup
      .selectAll('g')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', d => d.isCenter ? 'center-node' : 'outer-node')
      .attr('opacity', d => {
        // 中央ノードは最初から表示（アニメーション開始）
        if (d.isCenter) return 0;
        return 0; // 他のノードは最初は非表示
      })
      .attr('cursor', (d) => {
        // すべての会社ノードと人物ノードはクリック可能
        return (d.type === 'org' || d.type === 'person') ? 'pointer' : 'grab';
      })
      .call(d3.drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }))
      .on('mouseover', (event, d) => {
        const clickHint = (d.type === 'org' || d.type === 'person') 
          ? ' - クリックで詳細を表示' 
          : '';
        setTooltip({
          show: true,
          x: event.pageX + 10,
          y: event.pageY - 10,
          content: `${d.displayName || d.id} (${d.reviewCount} reviews)${clickHint}`
        });
      })
      .on('mouseout', () => {
        setTooltip(prev => ({ ...prev, show: false }));
      })
      .on('click', (event, d) => {
        // 会社ノードの場合は会社ページに遷移
        if (d.type === 'org') {
          // Nodeのidから会社スラッグを生成（c_プレフィックスを除去）
          const companySlug = d.id.startsWith('c_') ? d.id.substring(2) : d.id;
          window.location.href = `/company/${encodeURIComponent(companySlug)}`;
        } else if (d.type === 'person') {
          // ユーザーノードの場合はユーザーページに遷移（中央ノードも含む）
          const username = d.id.startsWith('u_') ? d.id.substring(2) : d.id;
          window.location.href = `/users/${encodeURIComponent(username)}`;
        }
      });

    // 各ノードタイプに応じて描画
    nodeGroups.each(function(d, i) {
      const group = d3.select(this);
      const radius = Math.round(22.5 * sizeScale(d) * 10) / 10; // 小数点第1位で丸める
      
      console.log(`Processing node ${i}:`, {
        id: d.id,
        type: d.type,
        reviewCount: d.reviewCount,
        calculatedRadius: radius,
        imageUrl: d.imageUrl,
        isCenter: d.isCenter
      });
      
      if (d.isCenter) {
        if (centerMode === 'avatar' && d.imageUrl) {
          // 中心ノード: ユーザーアバター画像を円形に表示
          group.append('circle')
            .attr('r', radius)
            .attr('fill', '#ffffff')
            .attr('stroke', '#FF5E9E')
            .attr('stroke-width', 3);
          
          // foreignObject でユーザー画像を表示
          const foreign = group.append('foreignObject')
            .attr('x', -radius)
            .attr('y', -radius)
            .attr('width', radius * 2)
            .attr('height', radius * 2);
          
          foreign.append('xhtml:div')
            .style('width', '100%')
            .style('height', '100%')
            .style('border-radius', '50%')
            .style('overflow', 'hidden')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center')
            .append('xhtml:img')
            .attr('src', d.imageUrl)
            .style('width', '100%')
            .style('height', '100%')
            .style('object-fit', 'cover')
            .on('error', function() {
              // フォールバック: 画像が読み込めない場合は名前の最初の文字を表示
              d3.select(this.parentNode)
                .style('background-color', '#FF5E9E')
                .style('color', 'white')
                .style('font-size', `${radius * 0.6}px`)
                .style('font-weight', 'bold')
                .text((d.displayName || d.id).charAt(0).toUpperCase());
            });
        } else {
          // 中心ノード: Bondロゴを円形に表示（デフォルト）
          group.append('circle')
            .attr('r', radius)
            .attr('fill', '#FF5E9E')
            .attr('stroke', 'rgba(255,94,158,0.5)')
            .attr('stroke-width', 3);
          
          // Bondロゴ画像を上に重ねて表示
          group.append('image')
            .attr('href', '/bond-logo.png')
            .attr('x', -radius * 0.7)
            .attr('y', -radius * 0.7)
            .attr('width', radius * 1.4)
            .attr('height', radius * 1.4)
            .attr('preserveAspectRatio', 'xMidYMid meet');
        }
      } else if (d.imageUrl) {
        // 画像があるノード: foreignObject を使用した確実な表示
        console.log(`🖼️ Rendering image node ${i}:`, d.id, 'URL:', d.imageUrl, 'Type:', d.type, 'IsCenter:', d.isCenter);
        
        // 背景円を追加
        group.append('circle')
          .attr('r', radius)
          .attr('fill', '#ffffff')
          .attr('stroke', nodeFill(d))
          .attr('stroke-width', 2);
        
        // foreignObject で HTML img 要素を使用
        const foreign = group.append('foreignObject')
          .attr('x', -radius)
          .attr('y', -radius)
          .attr('width', radius * 2)
          .attr('height', radius * 2);
        
        foreign.append('xhtml:div')
          .style('width', '100%')
          .style('height', '100%')
          .style('border-radius', '50%')
          .style('overflow', 'hidden')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('justify-content', 'center')
          .append('xhtml:img')
          .attr('src', d.imageUrl)
          .style('width', '100%')
          .style('height', '100%')
          .style('object-fit', 'cover')
          .on('load', function() {
            console.log(`✅ Image loaded via foreignObject: ${d.imageUrl}`);
          })
          .on('error', function() {
            console.error(`❌ Image failed via foreignObject: ${d.imageUrl}`);
            // フォールバック
            d3.select(this.parentNode)
              .style('background-color', nodeFill(d))
              .style('color', 'white')
              .style('font-size', `${radius * 0.6}px`)
              .style('font-weight', 'bold')
              .text((d.displayName || d.id).charAt(0).toUpperCase());
          });
      } else {
        // 画像がないノード: 色付き円
        group.append('circle')
          .attr('r', radius)
          .attr('fill', nodeFill(d))
          .attr('stroke', 'rgba(0,0,0,0.2)')
          .attr('stroke-width', 1);
      }
    });

    // ラベルの描画
    const labels = nodeGroup
      .selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .text((d: Node) => d.displayName || d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', (d: Node) => Math.round((22.5 * sizeScale(d) + 30) * 10) / 10)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1F1C1A')
      .attr('pointer-events', 'none')
      .attr('opacity', d => d.isCenter ? 0 : 0); // 最初は非表示

    // シミュレーション更新時の描画
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)
        .each(function(d: any, i: number) {
          // グラデーションの方向をリンクの方向に合わせて動的に更新
          const gradId = `grad-${i}`;
          const grad = defs.select(`#${gradId}`);
          
          grad.attr('x1', d.source.x)
             .attr('y1', d.source.y)
             .attr('x2', d.target.x)
             .attr('y2', d.target.y);
        });

      nodeGroups
        .attr('transform', (d: Node) => `translate(${d.x},${d.y})`);

      labels
        .attr('x', (d: Node) => d.x!)
        .attr('y', (d: Node) => d.y!);
    });

    // アニメーション：中央ノードを最初に表示、その後周辺ノードを時計回りに1つずつ表示
    // 直接評価したノードを先に、繋がりのあるユーザー経由のノードは後に表示
    const startAnimation = () => {
      // 中央ノードをフェードイン
      nodeGroups.filter((d: Node) => d.isCenter)
        .transition()
        .duration(500)
        .attr('opacity', 1);

      labels.filter((d: Node) => d.isCenter)
        .transition()
        .duration(500)
        .attr('opacity', 1);

      // 直接評価したノードと繋がりのあるユーザー経由のノードを分離
      const directNodes = sortedNonCenterNodes.filter(n => !n.isConnectedUserNode);
      const connectedUserNodes = sortedNonCenterNodes.filter(n => n.isConnectedUserNode);

      const delay = 80; // 各ノード間の遅延（ms）

      // フェーズ1: 直接評価したノードを表示（500ms後に開始）
      setTimeout(() => {
        directNodes.forEach((node, index) => {
          const nodeId = node.id;

          setTimeout(() => {
            nodeGroups.filter((d: Node) => d.id === nodeId)
              .transition()
              .duration(300)
              .attr('opacity', 1);

            labels.filter((d: Node) => d.id === nodeId)
              .transition()
              .duration(300)
              .attr('opacity', 1);

            // このノードに関連するリンク（直接評価のリンクのみ）をフェードイン
            links.filter((d: any) => {
              const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
              const targetId = typeof d.target === 'string' ? d.target : d.target.id;
              const isRelated = sourceId === nodeId || targetId === nodeId;
              const isDirectLink = !d.isConnectedUserLink;
              return isRelated && isDirectLink;
            })
              .transition()
              .duration(300)
              .attr('opacity', 0.9);
          }, index * delay);
        });
      }, 600);

      // フェーズ2: 繋がりのあるユーザー経由のノードを表示（直接評価ノードの後）
      const phase2StartDelay = 600 + (directNodes.length * delay) + 400; // 少し間を空ける
      setTimeout(() => {
        connectedUserNodes.forEach((node, index) => {
          const nodeId = node.id;

          setTimeout(() => {
            nodeGroups.filter((d: Node) => d.id === nodeId)
              .transition()
              .duration(300)
              .attr('opacity', 1);

            labels.filter((d: Node) => d.id === nodeId)
              .transition()
              .duration(300)
              .attr('opacity', 1);

            // このノードに関連するリンクをフェードイン
            links.filter((d: any) => {
              const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
              const targetId = typeof d.target === 'string' ? d.target : d.target.id;
              return sourceId === nodeId || targetId === nodeId;
            })
              .transition()
              .duration(300)
              .attr('opacity', 0.9);
          }, index * delay);
        });
      }, phase2StartDelay);
    };

    // シミュレーションが安定したらアニメーション開始
    setTimeout(startAnimation, 100);

    return () => {
      simulation.stop();
    };
  }, [data, width, height, nodeScale]);

  // レビュー件数の凡例
  const legendData = [
    { count: 10, label: '10件' },
    { count: 50, label: '50件' },
    { count: 100, label: '100件' },
    { count: 200, label: '200件' }
  ];

  return (
    <div className="relative w-full h-full bg-bond-cream overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full max-w-full"
        style={{ maxHeight: '100%' }}
      />
      

      {/* ツールチップ */}
      {tooltip.show && (
        <div
          className="absolute z-50 bg-gray-800 text-white px-2 py-1 rounded text-xs pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default BondHeartGraph;