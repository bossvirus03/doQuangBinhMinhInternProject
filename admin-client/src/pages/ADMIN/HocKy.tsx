import { useEffect, useState } from "react";
import { Button, Table, Tag, Space, Modal, Form, Select, Input, Popconfirm, message, Checkbox } from "antd";
import { api } from "../../lib/api";

type SemesterRow = {
  code: string;
  startYear: number;
  term: "HK1" | "HK2" | "HK_HE";
  name: string;
  active: boolean;
  persisted?: boolean;
};

export default function HocKy() {
  const [rows, setRows] = useState<SemesterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SemesterRow | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/semesters");
      setRows(r.data || []);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Không tải được học kỳ");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const onCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };
  const onEdit = (r: SemesterRow) => {
    setEditing(r);
    form.setFieldsValue({ term: r.term, startYear: r.startYear, name: r.name, active: r.active });
    setOpen(true);
  };
  const onDelete = async (code: string) => {
    try {
      await api.delete(`/admin/semesters/${code}`);
      message.success("Đã xoá");
      load();
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Xoá thất bại");
    }
  };

  const submit = async () => {
    const v = await form.validateFields();
    try {
      if (editing) {
        await api.patch(`/admin/semesters/${editing.code}`, { name: v.name, active: v.active });
        message.success("Đã cập nhật");
      } else {
        await api.post(`/admin/semesters`, { term: v.term, startYear: Number(v.startYear), active: v.active, name: v.name });
        message.success("Đã tạo");
      }
      setOpen(false);
      setEditing(null);
      form.resetFields();
      load();
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Lưu thất bại");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Quản lý học kỳ</h2>
        <Button type="primary" onClick={onCreate}>Thêm học kỳ</Button>
      </div>
      <Table
        rowKey="code"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: "Mã", dataIndex: "code", width: 130 },
          { title: "Năm bắt đầu", dataIndex: "startYear", width: 110 },
          { title: "Học kỳ", dataIndex: "term", width: 90 },
          { title: "Tên", dataIndex: "name" },
            { title: "Trạng thái", dataIndex: "active", width: 110, render: (v: boolean) => v ? <Tag color="green">Đang dùng</Tag> : <Tag>Nháp</Tag> },
          { title: "Thao tác", width: 180, render: (_: any, r: SemesterRow) => (
            <Space>
              <Button size="small" onClick={() => onEdit(r)}>Sửa</Button>
              <Popconfirm title="Xoá học kỳ này?" onConfirm={() => onDelete(r.code)}>
                <Button danger size="small">Xoá</Button>
              </Popconfirm>
            </Space>
          )},
        ]}
      />
      <Modal title={editing ? "Sửa học kỳ" : "Thêm học kỳ"} open={open} onOk={submit} onCancel={() => { setOpen(false); setEditing(null); form.resetFields(); }} okText="Lưu">
        <Form form={form} layout="vertical">
          {!editing && (
            <>
              <Form.Item name="term" label="Học kỳ" rules={[{ required: true }]}> <Select options={[{value:'HK1',label:'HK1'}, {value:'HK2',label:'HK2'}, {value:'HK_HE',label:'HK Hè'}]} /> </Form.Item>
              <Form.Item name="startYear" label="Năm bắt đầu" rules={[{ required: true }]}> <Input type="number" placeholder="2024" /> </Form.Item>
            </>
          )}
          <Form.Item name="name" label="Tên học kỳ" rules={[{ required: true }]}> <Input placeholder="Ví dụ: Học kỳ I năm 2024-2025" /> </Form.Item>
          <Form.Item name="active" valuePropName="checked" label="Đang sử dụng"> <Checkbox /> </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
