// src/pages/TEACHER/DiemRL.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tabs, Tag, message } from "antd";

type Homeroom = { Malop: string; Tenlop: string };
type DRL = {
  id: number;
  Mahs: string;
  Hotenhs?: string;
  Malop: string;
  // giữ tương thích cả 2
  Namhoc?: number;
  Nam?: number;
  Hocky: "HK1" | "HK2" | "HK_HE";
  Diem: number;
  Note?: string;
  createdAt?: string;
};

export default function DiemRL() {
  const [classes, setClasses] = useState<Homeroom[]>([]);
  const [malop, setMalop] = useState<string>();
  const [namhoc, setNamhoc] = useState<number>(new Date().getFullYear());
  const [hocky, setHocky] = useState<"HK1" | "HK2">("HK1");
  const [rows, setRows] = useState<DRL[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  // state này CHỈ dùng cho tab “Theo học sinh”, KHÔNG dùng trong Form modal
  const [searchMahs, setSearchMahs] = useState<string>("");
  const [studentRows, setStudentRows] = useState<DRL[]>([]);
  const allowScore = useMemo(() => (v: number) => v >= 0 && v <= 100, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/teacher/me/homerooms");
        setClasses(r.data);
        if (r.data?.length) setMalop(r.data[0].Malop);
      } catch (e: any) {
        message.error(e?.response?.data?.message ?? "Không tải được danh sách lớp");
      }
    })();
  }, []);

  const loadByClass = async () => {
    if (!malop) return;
    setLoading(true);
    try {
      const r = await api.get("/teacher/me/drl", {
        params: { Malop: malop, Namhoc: namhoc, Hocky: hocky },
      });
      setRows(r.data);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Lỗi tải điểm rèn luyện");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadByClass();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [malop, namhoc, hocky]);

  // ---- open modals
  const openAdd = () => {
    setEditingId(null);
    setOpen(true);
    form.resetFields(); // dọn form trước
    // đặt default đúng theo tab hiện tại
    form.setFieldsValue({
      Mahs: undefined,
      Diem: undefined,
      Namhoc: namhoc,
      Hocky: hocky,
      Note: undefined,
    });
  };

  const openEdit = (r: DRL) => {
    setEditingId(r.id);
    setOpen(true);
    form.resetFields(); // dọn form trước
    // fallback Namhoc từ Nam (trường hợp response cũ)
    form.setFieldsValue({
      Mahs: r.Mahs,
      Diem: r.Diem,
      Namhoc: r.Namhoc ?? r.Nam ?? namhoc,
      Hocky: (r.Hocky ?? hocky) as DRL["Hocky"],
      Note: r.Note,
    });
  };

  const remove = async (id: number) => {
    try {
      await api.delete(`/teacher/me/drl/${id}`);
      message.success("Đã xóa");
      loadByClass();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Xóa thất bại");
    }
  };

  const submit = async () => {
    const v = await form.validateFields();
    if (!allowScore(v.Diem)) return message.error("Điểm phải trong khoảng 0..100");

    const payload = {
      Mahs: String(v.Mahs).trim(),
      Malop: malop,
      Namhoc: Number(v.Namhoc ?? namhoc),
      Hocky: (v.Hocky ?? hocky) as DRL["Hocky"],
      Diem: Number(v.Diem),
      Note: v.Note,
    };
    if (!payload.Malop) return message.error("Chưa chọn lớp");

    setSaving(true);
    try {
      if (editingId !== null) {
        await api.put(`/teacher/me/drl/${editingId}`, payload);
        message.success("Đã cập nhật");
      } else {
        await api.post(`/teacher/me/drl`, payload);
        message.success("Đã thêm");
      }
      setOpen(false);
      setEditingId(null);
      form.resetFields();
      loadByClass();
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const searchByStudent = async () => {
    if (!searchMahs) return setStudentRows([]);
    try {
      const r = await api.get(`/teacher/me/drl/student/${encodeURIComponent(searchMahs.trim())}`);
      setStudentRows(r.data);
    } catch (e: any) {
      message.error(e?.response?.data?.message ?? "Không tải được điểm theo học sinh");
    }
  };

  return (
    <Card>
      <Tabs
        items={[
          {
            key: "class",
            label: "Theo lớp chủ nhiệm",
            children: (
              <>
                <Space wrap style={{ marginBottom: 12 }}>
                  <Select
                    style={{ minWidth: 220 }}
                    value={malop}
                    onChange={setMalop}
                    placeholder="Chọn lớp"
                    options={classes.map((c) => ({ value: c.Malop, label: c.Tenlop || c.Malop }))}
                  />
                  <InputNumber
                    value={namhoc}
                    onChange={(v) => setNamhoc(Number(v))}
                    controls
                    style={{ width: 120 }}
                    min={2000}
                  />
                  <Select
                    value={hocky}
                    onChange={setHocky as any}
                    options={[
                      { value: "HK1", label: "Học kỳ I" },
                      { value: "HK2", label: "Học kỳ II" },
                    ]}
                  />
                  <Button onClick={loadByClass}>Tải lại</Button>
                  <Button type="primary" onClick={openAdd}>
                    Thêm điểm
                  </Button>
                </Space>

                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={rows}
                  columns={[
                    { title: "Mã HS", dataIndex: "Mahs", width: 100 },
                    { title: "Họ tên", dataIndex: "Hotenhs" },
                    // BE mới: Namhoc; BE cũ: Nam
                    { title: "Năm", dataIndex: "Namhoc", width: 90, render: (_: any, r: DRL) => r.Namhoc ?? r.Nam },
                    {
                      title: "Học kỳ",
                      dataIndex: "Hocky",
                      width: 90,
                      render: (v: string) => <Tag color="blue">{v}</Tag>,
                    },
                    { title: "Điểm RL", dataIndex: "Diem", width: 100 },
                    { title: "Ghi chú", dataIndex: "Note", ellipsis: true },
                    {
                      title: "Hành động",
                      width: 150,
                      render: (_: any, r: DRL) => (
                        <Space>
                          <Button size="small" onClick={() => openEdit(r)}>
                            Sửa
                          </Button>
                          <Button size="small" danger onClick={() => remove(r.id)}>
                            Xóa
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                />

                <Modal
                  title={editingId !== null ? "Sửa điểm RL" : "Thêm điểm RL"}
                  open={open}
                  onOk={submit}
                  confirmLoading={saving}
                  onCancel={() => {
                    setOpen(false);
                    setEditingId(null);
                    form.resetFields();
                  }}
                  destroyOnClose
                >
                  <Form form={form} layout="vertical" preserve={false}>
                    <Form.Item name="Mahs" label="Mã học sinh" rules={[{ required: true, message: "Nhập mã học sinh" }]}>
                      {/* RẤT QUAN TRỌNG: Không được set value/onChange ở đây để Form quản lý */}
                      <Input />
                    </Form.Item>
                    <Form.Item name="Diem" label="Điểm rèn luyện (0-100)" rules={[{ required: true, message: "Nhập điểm" }]}>
                      <InputNumber min={0} max={100} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="Namhoc" label="Năm học">
                      <InputNumber min={2000} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="Hocky" label="Học kỳ">
                      <Select
                        options={[
                          { value: "HK1", label: "Học kỳ I" },
                          { value: "HK2", label: "Học kỳ II" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item name="Note" label="Ghi chú">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                  </Form>
                </Modal>
              </>
            ),
          },
          {
            key: "student",
            label: "Theo học sinh",
            children: (
              <>
                <Space style={{ marginBottom: 12 }}>
                  <Input
                    placeholder="Nhập mã HS (thuộc lớp của bạn)"
                    value={searchMahs}
                    onChange={(e) => setSearchMahs(e.target.value)}
                    onPressEnter={searchByStudent}
                    style={{ width: 260 }}
                  />
                  <Button type="primary" onClick={searchByStudent}>
                    Xem
                  </Button>
                </Space>
                <Table
                  rowKey="id"
                  dataSource={studentRows}
                  columns={[
                    { title: "Mã HS", dataIndex: "Mahs", width: 100 },
                    { title: "Họ tên", dataIndex: "Hotenhs" },
                    { title: "Lớp", dataIndex: "Malop", width: 110 },
                    { title: "Năm", dataIndex: "Namhoc", width: 90, render: (_: any, r: DRL) => r.Namhoc ?? r.Nam },
                    { title: "Học kỳ", dataIndex: "Hocky", width: 90 },
                    { title: "Điểm", dataIndex: "Diem", width: 90 },
                    { title: "Ghi chú", dataIndex: "Note" },
                  ]}
                />
              </>
            ),
          },
        ]}
      />
    </Card>
  );
}
