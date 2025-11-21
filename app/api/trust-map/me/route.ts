import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

export const GET = requireAuth(async (request: NextRequest, user) => {
  const meId = user.id;

  await connectDB();
  const db = mongoose.connection.db;
  const Reviews = db.collection("evaluations");
  const Users = db.collection("users");
  const Companies = db.collection("companies");

  // 自分がレビューした会社ごとに集計
  const edgesAgg = await Reviews.aggregate([
    { $match: { userId: meId } },
    {
      $group: {
        _id: "$companySlug",
        companyName: { $first: "$companyName" },
        count: { $sum: 1 },
        avgScore: { $avg: "$rating" },
        weight: {
          $sum: {
            $ifNull: [
              {
                $multiply: [
                  1,
                  // 直近を少し重く（365日減衰）
                  {
                    $exp: {
                      $divide: [
                        { $subtract: [new Date(), { $ifNull: ["$createdAt", new Date()] }] },
                        1000 * 60 * 60 * 24 * 365,
                      ],
                    },
                  },
                ],
              },
              1,
            ],
          },
        },
      },
    },
    { $sort: { weight: -1 } },
    { $limit: 200 },
  ]).toArray();

  const companySlugs = edgesAgg.map(e => e._id);
  const [me, companies] = await Promise.all([
    Users.findOne({ _id: meId }, { projection: { _id: 1, name: 1, avatarUrl: 1 } }),
    Companies.find({ slug: { $in: companySlugs } })
      .project({ _id: 1, name: 1, slug: 1, logoUrl: 1 })
      .toArray(),
  ]);

  const companyMap = Object.fromEntries(companies.map(c => [c.slug, c]));

  // ノード
  const nodes: any[] = [];
  // 中心（自分）
  nodes.push({
    id: `u:${meId}`,
    type: "person",
    label: me?.name ?? "Me",
    img: me?.avatarUrl,
    size: 36,
    // 中心固定
    fx: 0,
    fy: 0,
  });

  // 会社ノード
  for (const e of edgesAgg) {
    const c = companyMap[e._id];
    if (!c) {
      // 会社データがない場合は、評価データから作成
      const size = Math.min(42, 14 + (e.count || 1) * 4);
      nodes.push({
        id: `c:${e._id}`,
        type: "company",
        label: e.companyName || e._id,
        img: undefined,
        size,
        slug: e._id,
        meta: { avgScore: Number(e.avgScore?.toFixed(2) ?? 0), count: e.count },
      });
      continue;
    }
    const size = Math.min(42, 14 + (e.count || 1) * 4); // レビュー件数で拡大
    nodes.push({
      id: `c:${c.slug}`,
      type: "company",
      label: c.name,
      img: c.logoUrl,
      size,
      slug: c.slug,
      meta: { avgScore: Number(e.avgScore?.toFixed(2) ?? 0), count: e.count },
    });
  }

  // エッジ（自分→会社）
  const links = edgesAgg.map(e => ({
    source: `u:${meId}`,
    target: `c:${e._id}`,
    weight: Math.min(3, Math.max(0.7, Number((e.weight || 1).toFixed(2)))),
  }));

  return new Response(JSON.stringify({ nodes, links }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});