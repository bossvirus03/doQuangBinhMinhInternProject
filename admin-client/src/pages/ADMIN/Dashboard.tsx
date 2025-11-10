// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Card, Row, Col, Button, Typography, Skeleton } from "antd";
import {
  TeamOutlined,
  BarChartOutlined,
  UserAddOutlined,
  PieChartOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { api } from "../../lib/api";
import { Link } from "react-router-dom";

const { Text } = Typography;

type Counts = {
  giaovien: number;
  monhoc: number;
  hocsinh: number;
  tintuc: number;
};

export default function Dashboard() {
  const [counts, setCounts] = useState<Counts>({
    giaovien: 0,
    monhoc: 0,
    hocsinh: 0,
    tintuc: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [gv, mh, hs, tt] = await Promise.all([
          api.get("/giaovien", { params: { page: 1, limit: 1 } }),
          api.get("/monhoc", { params: { page: 1, limit: 1 } }),
          api.get("/hocsinh", { params: { page: 1, limit: 1 } }),
          api.get("/news", { params: { page: 1, limit: 1 } }),
        ]);

        setCounts({
          giaovien: gv.data?.total ?? 0,
          monhoc: mh.data?.total ?? 0,
          hocsinh: hs.data?.total ?? 0,
          tintuc: tt.data?.length ?? 0,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tiles = [
    {
      key: "gv",
      title: "Giáo viên",
      value: counts.giaovien,
      color: "#1e90ff", // xanh dương
      icon: <TeamOutlined style={{ fontSize: 28, opacity: 0.9 }} />,
      link: "/giao-vien",
    },
    {
      key: "mh",
      title: "Môn học",
      value: counts.monhoc,
      color: "#1abc9c", // xanh lá
      icon: <BarChartOutlined style={{ fontSize: 28, opacity: 0.9 }} />,
      link: "/mon-hoc",
    },
    {
      key: "hs",
      title: "Học sinh",
      value: counts.hocsinh,
      color: "#f39c12", // cam
      icon: <UserAddOutlined style={{ fontSize: 28, opacity: 0.9 }} />,
      link: "/hoc-sinh",
    },
    {
      key: "tt",
      title: "Tin tức",
      value: counts.tintuc,
      color: "#e74c3c", // đỏ
      icon: <PieChartOutlined style={{ fontSize: 28, opacity: 0.9 }} />,
      link: "/tin-tuc",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontWeight: 600 }}>
          Trường THPT NGUYỄN TẤT THÀNH
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 14 }}>
            Quản lý điểm học sinh
          </Text>
        </h2>
      </div>

      <Row gutter={[16, 16]}>
        {tiles.map((t) => (
          <Col xs={24} sm={12} md={12} lg={6} key={t.key}>
            <Card
              bodyStyle={{ padding: 0 }}
              style={{ border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <div
                style={{
                  background: t.color,
                  color: "#fff",
                  padding: 16,
                  minHeight: 110,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {t.icon}
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
                      {loading ? <Skeleton.Input active style={{ width: 60 }} /> : t.value}
                    </div>
                    <div style={{ opacity: 0.95 }}>{t.title}</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Link to={t.link}>
                    <Button type="link" style={{ color: "#fff" }}>
                      Chi tiết <ArrowRightOutlined />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

    </div>
  );
}
