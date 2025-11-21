import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Form, Input, Table, Tag, Space, Popconfirm, message, Checkbox } from "antd";
import { api } from "../../lib/api";

type NamHocRow = { key: string; code: string; name: string; active: boolean };

export default function NamHoc() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NamHocRow | null>(null);
  const [form] = Form.useForm<NamHocRow>();
  const [rows, setRows] = useState<NamHocRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await api.get("/admin/school-years");
        const list: NamHocRow[] = (r.data || []).map((y: any) => ({
          key: y.code,
          code: y.code,
            name: y.name,
            active: !!y.active,
        }));
        setRows(list);
      } catch (e: any) {
        message.error(e?.response?.data?.message || "Không tải được năm học");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = useMemo(
    () => [
      { title: "Mã", dataIndex: "code" },
      { title: "Tên năm học", dataIndex: "name" },
      {
        title: "Trạng thái",
        dataIndex: "active",
        render: (v: boolean) => (v ? <Tag color="green">Đang dùng</Tag> : <Tag>Nháp</Tag>),
      },
      {
        title: "Thao tác",
        render: (_: any, r: NamHocRow) => (
          <Space>
            <Button size="small" onClick={() => onEdit(r)}>Sửa</Button>
            <Popconfirm title="Xoá năm học này?" onConfirm={() => onDelete(r.key)}>
              <Button danger size="small">Xoá</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    []
  );

  const onCreate = () => {
    form.resetFields();
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (r: NamHocRow) => {
    setEditing(r);
    setOpen(true);
    form.setFieldsValue(r);
  };

  const onDelete = (key: string) => {
    setRows((prev: NamHocRow[]) => prev.filter((x: NamHocRow) => x.key !== key));
    message.success("Đã xoá (chỉ local — chưa lưu server)");
  };

  const onSubmit = async () => {
    const v = await form.validateFields();
    if (editing) {
      setRows((prev: NamHocRow[]) => prev.map((x: NamHocRow) => (x.key === editing.key ? { ...editing, ...v } : x)));
      message.success("Đã cập nhật (local)");
    } else {
      setRows((prev: NamHocRow[]) => [{ ...v, key: v.code }, ...prev]);
      message.success("Đã tạo (local)");
    }
    setOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Quản lý năm học</h2>
        <Button type="primary" onClick={onCreate}>Thêm năm học</Button>
      </div>

  <Table rowKey="key" columns={columns as any} dataSource={rows} loading={loading} />

      <Modal
        title={editing ? "Sửa năm học" : "Thêm năm học"}
        open={open}
        onOk={onSubmit}
        onCancel={() => setOpen(false)}
        okText="Lưu"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã" rules={[{ required: true }]}>
            <Input placeholder="VD: NH2425" />
          </Form.Item>
          <Form.Item name="name" label="Tên năm học" rules={[{ required: true }]}>
            <Input placeholder="Năm học 2024-2025" />
          </Form.Item>
          <Form.Item name="active" label="Đang sử dụng" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
