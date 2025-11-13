// App.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/AUTH/Login";
import Shell from "./components/Shell";
import Home from "./pages/ADMIN/Home";
import Dashboard from "./pages/ADMIN/Dashboard";
import NamHoc from "./pages/ADMIN/NamHoc";
import HocKy from "./pages/ADMIN/HocKy";
import GiaoVien from "./pages/ADMIN/GiaoVien";
import HocSinh from "./pages/ADMIN/HocSinh";
import LopHoc from "./pages/ADMIN/LopHoc";
import MonHoc from "./pages/ADMIN/MonHoc";
import TinTuc from "./pages/ADMIN/TinTuc";
import DiemRL from "./pages/TEACHER/DiemRL";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LopChuNhiem from "./pages/TEACHER/LopChuNhiem";
import LopPhuTrach from "./pages/TEACHER/LopPhuTrach";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* All authenticated routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tin-tuc" element={<TinTuc />} />

          {/* Admin-only block */}
          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            {" "}
            {/* ✅ ADMIN */}
            <Route path="nam-hoc" element={<NamHoc />} />
            <Route path="hoc-ky" element={<HocKy />} />
            <Route path="mon-hoc" element={<MonHoc />} />
            <Route path="lop-hoc" element={<LopHoc />} />
            <Route path="hoc-sinh" element={<HocSinh />} />
            <Route path="giao-vien" element={<GiaoVien />} />
          </Route>

          {/* Teacher-only */}
          <Route element={<ProtectedRoute roles={["TEACHER"]} />}>
            <Route path="diem-rl" element={<DiemRL />} />
            <Route path="lop-chu-nhiem" element={<LopChuNhiem />} />
            <Route path="lop-phu-trach" element={<LopPhuTrach />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
