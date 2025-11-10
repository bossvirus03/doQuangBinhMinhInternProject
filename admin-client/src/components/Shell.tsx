import { Layout, Menu, Typography, theme, Button } from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  LogoutOutlined,
  HomeOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  BookOutlined,
  ReadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const { Header, Sider, Content } = Layout;

type Role = "ADMIN" | "TEACHER" | "USER";
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null") as
      | { id: number; email: string; role: Role }
      | null;
  } catch {
    return null;
  }
}

export default function Shell() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const location = useLocation();
  const navigate = useNavigate();

  const me = getUser();
  const name = me?.email || "Quản lý";
  const role = me?.role || ("USER" as Role);

  // key đang chọn: lấy key có prefix khớp nhất với pathname
  const allKeys = [
    "/dashboard",
    "/users",
    "/nam-hoc",
    "/hoc-ky",
    "/mon-hoc",
    "/lop-hoc",
    "/hoc-sinh",
    "/giao-vien",
    "/tin-tuc",
  ];
  const currentKey =
    allKeys.find((k) => location.pathname.startsWith(k)) ?? "";

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  // Menu cho ADMIN
  const adminItems = [
    { key: "/dashboard", icon: <AppstoreOutlined />, label: <Link to="/dashboard">Dashboard</Link> },
    { key: "/users", icon: <UserOutlined />, label: <Link to="/users">Quản lý người dùng</Link> },
    { key: "/nam-hoc", icon: <CalendarOutlined />, label: <Link to="/nam-hoc">Quản lý năm học</Link> },
    { key: "/hoc-ky", icon: <BookOutlined />, label: <Link to="/hoc-ky">Quản lý học kỳ</Link> },
    { key: "/mon-hoc", icon: <ReadOutlined />, label: <Link to="/mon-hoc">Quản lý môn học</Link> },
    { key: "/lop-hoc", icon: <TeamOutlined />, label: <Link to="/lop-hoc">Quản lý lớp học</Link> },
    { key: "/hoc-sinh", icon: <UserOutlined />, label: <Link to="/hoc-sinh">Quản lý học sinh</Link> },
    { key: "/giao-vien", icon: <UserOutlined />, label: <Link to="/giao-vien">Quản lý giáo viên</Link> },
    { key: "/tin-tuc", icon: <FileTextOutlined />, label: <Link to="/tin-tuc">Tin tức</Link> },
  ];

  const teacherItems = [
    { key: "/diem-rl", icon: <FileTextOutlined />, label: <Link to="/diem-rl">Điểm rèn luyện</Link> },
    { key: "/lop-chu-nhiem", icon: <TeamOutlined />, label: <Link to="/lop-chu-nhiem">Lớp chủ nhiệm</Link> },
    { key: "/lop-phu-trach", icon: <TeamOutlined />, label: <Link to="/lop-phu-trach">Lớp phụ trách</Link> },
  ];

  const basicItems = [
    { key: "/dashboard", icon: <AppstoreOutlined />, label: <Link to="/dashboard">Dashboard</Link> },
    { key: "/tin-tuc", icon: <FileTextOutlined />, label: <Link to="/tin-tuc">Tin tức</Link> },
  ];

  const items = role === "ADMIN" ? adminItems : role === "TEACHER"  ? teacherItems : basicItems;


  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div
          style={{
            height: 48,
            margin: 16,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <HomeOutlined />
          <Link to="/" style={{ color: "#fff", fontWeight: 600 }}>
            Trang quản trị
          </Link>
        </div>

        <Menu theme="dark" mode="inline" selectedKeys={[currentKey]} items={items} />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: "0 16px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography.Title level={5} style={{ margin: 0 }}>
            {/* tiêu đề trống */}
          </Typography.Title>
          <div>
            Chào mừng "{name}" ({role}) đến với hệ thống! &nbsp;
            <Button icon={<LogoutOutlined />} onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </Header>

        <Content style={{ margin: "16px" }}>
          <div
            style={{
              padding: 16,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
