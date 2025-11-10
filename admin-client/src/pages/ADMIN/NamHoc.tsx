import { useMemo, useState } from "react";
import { Button, Modal, Form, Input, Table, Tag, Space, Popconfirm, message } from "antd";

type NamHocRow = { key: string; code: string; name: string; active: boolean };

export default function NamHoc() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NamHocRow | null>(null);
  const [form] = Form.useForm<NamHocRow>();
  const [rows, setRows] = useState<NamHocRow[]>([
    { key: "NH2425", code: "NH2425", name: "Năm học 2024-2025", active: true },
    { key: "NH2526", code: "NH2526", name: "Năm học 2025-2026", active: false },
  ]);

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
    setRows(prev => prev.filter(x => x.key !== key));
    message.success("Đã xoá");
  };

  const onSubmit = async () => {
    const v = await form.validateFields();
    if (editing) {
      setRows(prev => prev.map(x => (x.key === editing.key ? { ...editing, ...v } : x)));
      message.success("Đã cập nhật");
    } else {
       setRows(prev => [{ ...v, key: v.code }, ...prev]);
      message.success("Đã tạo");
    }
    setOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Quản lý năm học</h2>
        <Button type="primary" onClick={onCreate}>Thêm năm học</Button>
      </div>

      <Table rowKey="key" columns={columns as any} dataSource={rows} />

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
            <Input type="checkbox" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
