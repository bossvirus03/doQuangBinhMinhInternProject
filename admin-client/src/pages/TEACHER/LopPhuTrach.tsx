// src/pages/TEACHER/LopPhuTrach.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Select,
  Table,
  Tag,
  Modal,
  Form,
  InputNumber,
  Space,
  Button,
  message,
} from "antd";
import { api } from "../../lib/api";

type Teaching = {
  Malop: string;
  Tenlop: string;
  Mamon: string;
  Tenmon: string;
  Namhoc: number;
  Hocky: "HK1" | "HK2" | "HK_HE";
};
type Student = {
  Mahs: string;
  Hotenhs: string;
  Ngaysinh?: string;
  Gioitinh?: "NAM" | "NU" | "KHAC";
};
type Score = {
  Mahs: string;
  Diemmieng?: number;
  Diem15p?: number;
  Diemhs2?: number;
  Diemhs3?: number;
  DiemTH?: number;
  Diemtbmon?: number;
};

export default function LopPhuTrach() {
  const [teachings, setTeachings] = useState<Teaching[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>();
  const [rows, setRows] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoresMap, setScoresMap] = useState<Record<string, Score>>({});

  // Modal edit score
  const [scoreOpen, setScoreOpen] = useState(false);
  const [scoreSaving, setScoreSaving] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [form] = Form.useForm();

  const keyOf = (t: Teaching) =>
    `${t.Malop}::${t.Mamon}::${t.Namhoc}::${t.Hocky}`;
  const selectedTeaching = useMemo(
    () => teachings.find((t) => keyOf(t) === selectedKey),
    [teachings, selectedKey]
  );

  useEffect(() => {
    (async () => {
      const res = await api.get("/teacher/me/teachings"); // lớp + môn đang dạy
      setTeachings(res.data);
      if (res.data?.length) setSelectedKey(keyOf(res.data[0]));
    })();
  }, []);

  useEffect(() => {
    if (!selectedTeaching) return;
    setLoading(true);
    Promise.all([
      api.get("/teacher/me/classes/" + selectedTeaching.Malop + "/students"),
      api.get("/diem/by-teaching", {
        params: {
          Malop: selectedTeaching.Malop,
          Mamon: selectedTeaching.Mamon,
          Namhoc: selectedTeaching.Namhoc,
          Hocky: selectedTeaching.Hocky,
        },
      }),
    ])
      .then(([studentsRes, scoresRes]) => {
        setRows(studentsRes.data);
        const map: Record<string, Score> = {};
        (scoresRes.data || []).forEach((s: any) => {
          map[s.Mahs] = {
            Mahs: s.Mahs,
            Diemmieng: s.Diemmieng,
            Diem15p: s.Diem15p,
            Diemhs2: s.Diemhs2,
            Diemhs3: s.Diemhs3,
            DiemTH: s.DiemTH,
            Diemtbmon: s.Diemtbmon,
          };
        });
        setScoresMap(map);
      })
      .finally(() => setLoading(false));
  }, [selectedTeaching]);

  const onRowClick = async (s: Student) => {
    if (!selectedTeaching) return;
    setCurrentStudent(s);
    form.resetFields();
    // load existing score by key
    try {
      const r = await api.get("/diem/by-key/find", {
        params: {
          Mahs: s.Mahs,
          Mamon: selectedTeaching.Mamon,
          Namhoc: selectedTeaching.Namhoc,
          Hocky: selectedTeaching.Hocky,
        },
      });
      const d = r.data || {};
      form.setFieldsValue({
        Diemmieng: d.Diemmieng,
        Diem15p: d.Diem15p,
        Diemhs2: d.Diemhs2,
        Diemhs3: d.Diemhs3,
        DiemTH: d.DiemTH,
        Diemtbmon: d.Diemtbmon,
      });
    } catch (e: any) {
      // if not found, keep empty (service returns null). Ignore errors.
    }
    setScoreOpen(true);
  };

  const saveScore = async () => {
    if (!selectedTeaching || !currentStudent) return;
    const v = await form.validateFields();
    const payload = {
      Mahs: currentStudent.Mahs,
      Mamon: selectedTeaching.Mamon,
      Namhoc: selectedTeaching.Namhoc,
      Hocky: selectedTeaching.Hocky,
      // optional scores
      ...(v.Diemmieng !== undefined ? { Diemmieng: Number(v.Diemmieng) } : {}),
      ...(v.Diem15p !== undefined ? { Diem15p: Number(v.Diem15p) } : {}),
      ...(v.Diemhs2 !== undefined ? { Diemhs2: Number(v.Diemhs2) } : {}),
      ...(v.Diemhs3 !== undefined ? { Diemhs3: Number(v.Diemhs3) } : {}),
      ...(v.DiemTH !== undefined ? { DiemTH: Number(v.DiemTH) } : {}),
      ...(v.Diemtbmon !== undefined ? { Diemtbmon: Number(v.Diemtbmon) } : {}),
    };
    setScoreSaving(true);
    try {
      await api.post("/diem/by-key/upsert", payload);
      message.success("Đã lưu điểm");
      setScoreOpen(false);
      // refresh scores list
      if (selectedTeaching) {
        const scoresRes = await api.get("/diem/by-teaching", {
          params: {
            Malop: selectedTeaching.Malop,
            Mamon: selectedTeaching.Mamon,
            Namhoc: selectedTeaching.Namhoc,
            Hocky: selectedTeaching.Hocky,
          },
        });
        const map: Record<string, Score> = {};
        (scoresRes.data || []).forEach((s: any) => {
          map[s.Mahs] = {
            Mahs: s.Mahs,
            Diemmieng: s.Diemmieng,
            Diem15p: s.Diem15p,
            Diemhs2: s.Diemhs2,
            Diemhs3: s.Diemhs3,
            DiemTH: s.DiemTH,
            Diemtbmon: s.Diemtbmon,
          };
        });
        setScoresMap(map);
      }
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Lưu điểm thất bại");
    } finally {
      setScoreSaving(false);
    }
  };

  return (
    <Card title="Lớp phụ trách">
      <div style={{ marginBottom: 12 }}>
        <Select
          value={selectedKey}
          onChange={setSelectedKey}
          options={teachings.map((t) => ({
            value: keyOf(t),
            label: `${t.Tenlop} — ${t.Tenmon} (Năm ${t.Namhoc}, ${t.Hocky})`,
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
              g === "NAM" ? (
                <Tag color="blue">Nam</Tag>
              ) : g === "NU" ? (
                <Tag color="magenta">Nữ</Tag>
              ) : (
                <Tag>Khác</Tag>
              ),
          },
          {
            title: "Miệng",
            dataIndex: "Diemmieng",
            width: 80,
            render: (_: any, r: Student) => scoresMap[r.Mahs]?.Diemmieng ?? "—",
          },
          {
            title: "15p",
            dataIndex: "Diem15p",
            width: 80,
            render: (_: any, r: Student) => scoresMap[r.Mahs]?.Diem15p ?? "—",
          },
          {
            title: "HS2",
            dataIndex: "Diemhs2",
            width: 80,
            render: (_: any, r: Student) => scoresMap[r.Mahs]?.Diemhs2 ?? "—",
          },
          {
            title: "HS3",
            dataIndex: "Diemhs3",
            width: 80,
            render: (_: any, r: Student) => scoresMap[r.Mahs]?.Diemhs3 ?? "—",
          },
          {
            title: "TH",
            dataIndex: "DiemTH",
            width: 80,
            render: (_: any, r: Student) => scoresMap[r.Mahs]?.DiemTH ?? "—",
          },
          {
            title: "TB Môn",
            dataIndex: "Diemtbmon",
            width: 90,
            render: (_: any, r: Student) => scoresMap[r.Mahs]?.Diemtbmon ?? "—",
          },
        ]}
        onRow={(record) => ({ onClick: () => onRowClick(record) })}
      />

      <Modal
        title={
          currentStudent
            ? `Sửa điểm: ${currentStudent.Hotenhs} (${currentStudent.Mahs})`
            : "Sửa điểm"
        }
        open={scoreOpen}
        onOk={saveScore}
        confirmLoading={scoreSaving}
        onCancel={() => {
          setScoreOpen(false);
          setCurrentStudent(null);
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Space size="middle" style={{ display: "flex", flexWrap: "wrap" }}>
            <Form.Item name="Diemmieng" label="Điểm miệng">
              <InputNumber min={0} max={10} step={0.1} />
            </Form.Item>
            <Form.Item name="Diem15p" label="Điểm 15p">
              <InputNumber min={0} max={10} step={0.1} />
            </Form.Item>
            <Form.Item name="Diemhs2" label="Điểm hệ số 2">
              <InputNumber min={0} max={10} step={0.1} />
            </Form.Item>
            <Form.Item name="Diemhs3" label="Điểm hệ số 3">
              <InputNumber min={0} max={10} step={0.1} />
            </Form.Item>
            <Form.Item name="DiemTH" label="Điểm thực hành">
              <InputNumber min={0} max={10} step={0.1} />
            </Form.Item>
            <Form.Item name="Diemtbmon" label="Điểm TB môn">
              <InputNumber min={0} max={10} step={0.1} />
            </Form.Item>
          </Space>
          {selectedTeaching && (
            <div style={{ color: "#888" }}>
              Môn: <b>{selectedTeaching.Tenmon}</b> — Lớp:{" "}
              <b>{selectedTeaching.Tenlop}</b> — Năm:{" "}
              <b>{selectedTeaching.Namhoc}</b> — Học kỳ:{" "}
              <b>{selectedTeaching.Hocky}</b>
            </div>
          )}
        </Form>
      </Modal>
    </Card>
  );
}
