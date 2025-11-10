// src/pages/Home.tsx
import { Typography, Card, Button } from "antd";
import { Link } from "react-router-dom";
import { HomeOutlined, DashboardOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export default function Home() {
  return (
    <div>
      <Card
        bordered={false}
        style={{
          padding: 32,
          background: "linear-gradient(135deg, #e0f7fa, #ffffff)",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <HomeOutlined style={{ fontSize: 28, color: "#1890ff" }} />
          <Title level={3} style={{ margin: 0 }}>
            Trang chủ
          </Title>
        </div>

        <Paragraph style={{ marginTop: 16, color: "#555", fontSize: 16 }}>
          Chào mừng bạn đến với hệ thống quản lý học sinh của{" "}
          <Text strong>Trường THPT NGUYỄN TẤT THÀNH</Text>.
        </Paragraph>

        <Paragraph style={{ color: "#777" }}>
          Tại đây bạn có thể quản lý các thông tin như giáo viên, học sinh, lớp học, và tin tức.
          <br />
          Để bắt đầu, hãy chọn menu bên trái hoặc truy cập trang Dashboard để xem thống kê tổng quan.
        </Paragraph>

        <Link to="/dashboard">
          <Button
            type="primary"
            size="large"
            icon={<DashboardOutlined />}
            style={{ marginTop: 16 }}
          >
            Mở Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
}
