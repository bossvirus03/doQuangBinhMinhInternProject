// src/pages/TEACHER/LopPhuTrach.tsx
import { useEffect, useState } from "react";
import { Card, Select, Table, Tag } from "antd";
import { api } from "../../lib/api";

type Teaching = { Malop: string; Tenlop: string; Mamon: string; Tenmon: string };
type Student = { Mahs: string; Hotenhs: string; Ngaysinh?: string; Gioitinh?: "NAM"|"NU"|"KHAC" };

export default function LopPhuTrach() {
  const [teachings, setTeachings] = useState<Teaching[]>([]);
  const [selected, setSelected] = useState<string>();
  const [rows, setRows] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await api.get("/teacher/me/teachings"); // lớp + môn đang dạy
      setTeachings(res.data);
      if (res.data?.length) setSelected(res.data[0].Malop);
    })();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api
      .get("/teacher/me/classes/" + selected + "/students") // chỉ HS trong lớp thuộc lớp mình dạy
      .then((r) => setRows(r.data))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <Card title="Lớp phụ trách">
      <div style={{ marginBottom: 12 }}>
        <Select
          value={selected}
          onChange={setSelected}
          options={teachings.map((t) => ({
            value: t.Malop,
            label: `${t.Tenlop} — ${t.Tenmon}`,
          }))}
          placeholder="Chọn lớp đang dạy"
          style={{ minWidth: 320 }}
        />
      </div>
      <Table
        rowKey="Mahs"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: "Mã HS", dataIndex: "Mahs", width: 110 },
          { title: "Họ tên", dataIndex: "Hotenhs" },
          {
            title: "Giới tính",
            dataIndex: "Gioitinh",
            width: 100,
            render: (g: Student["Gioitinh"]) =>
              g === "NAM" ? <Tag color="blue">Nam</Tag> : g === "NU" ? <Tag color="magenta">Nữ</Tag> : <Tag>Khác</Tag>,
          },
        ]}
      />
    </Card>
  );
}
