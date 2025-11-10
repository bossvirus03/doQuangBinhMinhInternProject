// src/pages/GiangDay.tsx (nếu bạn muốn)
import { useEffect, useState } from "react";
import { Table } from "antd";
import { api } from "../../lib/api";

type Giangday = { STT:number; Namhoc:number; Hocky:"HK1"|"HK2"|"HK_HE"; Magv:string; Malop:string; Mamon:string };

export default function GiangDay() {
  const [rows, setRows] = useState<Giangday[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/giangday", { params: { page:1, limit:100 } });
        setRows(res.data.items);
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Phân công giảng dạy</h2>
      <Table
        rowKey="STT"
        loading={loading}
        columns={[
          { title: "Năm học", dataIndex: "Namhoc" },
          { title: "Học kỳ", dataIndex: "Hocky" },
          { title: "Mã GV", dataIndex: "Magv" },
          { title: "Lớp", dataIndex: "Malop" },
          { title: "Môn", dataIndex: "Mamon" },
        ]}
        dataSource={rows}
      />
    </div>
  );
}
