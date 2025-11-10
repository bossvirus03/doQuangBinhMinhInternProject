// src/pages/TEACHER/LopChuNhiem.tsx
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Button, Card, DatePicker, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from "antd";
import dayjs from "dayjs";

type Homeroom = { Malop: string; Tenlop: string };
type Student = { Mahs: string; Hotenhs: string; Gioitinh: "NAM"|"NU"|"KHAC"; Ngaysinh?: string; Diachi?: string };

export default function LopChuNhiem() {
  const [classes, setClasses] = useState<Homeroom[]>([]);
  const [malop, setMalop] = useState<string>();
  const [rows, setRows] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    (async () => {
      const res = await api.get("/teacher/me/homerooms");
      setClasses(res.data);
      if (res.data?.length) setMalop(res.data[0].Malop);
    })();
  }, []);

  const load = async () => {
    if (!malop) return;
    setLoading(true);
    try {
      const r = await api.get(`/teacher/me/homerooms/${malop}/students`);
      setRows(r.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [malop]);

  const onAdd = () => { setEditingId(null); form.resetFields(); setOpen(true); };
  const onEdit = (s: Student) => {
    setEditingId(s.Mahs);
    form.setFieldsValue({ ...s, Ngaysinh: s.Ngaysinh ? dayjs(s.Ngaysinh) : undefined });
    setOpen(true);
  };
  const onDelete = async (id: string) => { await api.delete(`/teacher/me/homerooms/${malop}/students/${id}`); message.success("Đã xóa"); load(); };

  const submit = async () => {
    const v = await form.validateFields();
    const payload = {
      Mahs: v.Mahs, Hotenhs: v.Hotenhs, Gioitinh: v.Gioitinh,
      Ngaysinh: v.Ngaysinh ? dayjs(v.Ngaysinh).toISOString() : undefined,
      Diachi: v.Diachi,
    };
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/teacher/me/homerooms/${malop}/students/${editingId}`, payload);
        message.success("Đã cập nhật");
      } else {
        await api.post(`/teacher/me/homerooms/${malop}/students`, payload);
        message.success("Đã thêm");
      }
      setOpen(false); load();
    } finally { setSaving(false); }
  };

  return (
    <Card title="Lớp chủ nhiệm" extra={
      <Select style={{ minWidth: 240 }} value={malop} onChange={setMalop}
        options={classes.map(c => ({ value: c.Malop, label: c.Tenlop }))} />}
    >
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={onAdd}>Thêm học sinh</Button>
        <Button onClick={load}>Tải lại</Button>
      </Space>

      <Table
        rowKey="Mahs"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: "Mã HS", dataIndex: "Mahs", width: 110 },
          { title: "Họ tên", dataIndex: "Hotenhs" },
          { title: "Địa chỉ", dataIndex: "Diachi", ellipsis: true },
          {
            title: "Giới tính", dataIndex: "Gioitinh", width: 100,
            render: (g: Student["Gioitinh"]) => g==="NAM"?<Tag color="blue">Nam</Tag>:g==="NU"?<Tag color="magenta">Nữ</Tag>:<Tag>Khác</Tag>
          },
          {
            title: "Hành động", width: 160,
            render: (_: any, r: Student) => (
              <Space>
                <Button size="small" onClick={() => onEdit(r)}>Sửa</Button>
                <Popconfirm title="Xóa học sinh?" onConfirm={() => onDelete(r.Mahs)}>
                  <Button size="small" danger>Xóa</Button>
                </Popconfirm>
              </Space>
            )
          }
        ]}
      />

      <Modal title={editingId ? "Sửa học sinh" : "Thêm học sinh"} open={open} onOk={submit} confirmLoading={saving} onCancel={() => setOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="Mahs" label="Mã HS" rules={[{ required: true }]}><Input disabled={!!editingId}/></Form.Item>
          <Form.Item name="Hotenhs" label="Họ tên" rules={[{ required: true }]}><Input/></Form.Item>
          <Form.Item name="Gioitinh" label="Giới tính" rules={[{ required: true }]}><Select options={[{value:"NAM",label:"Nam"},{value:"NU",label:"Nữ"},{value:"KHAC",label:"Khác"}]} /></Form.Item>
          <Form.Item name="Diachi" label="Địa chỉ"><Input/></Form.Item>
          <Form.Item name="Ngaysinh" label="Ngày sinh"><DatePicker format="YYYY-MM-DD" style={{width:"100%"}}/></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
