import { useState } from "react";
import { Button, Form, Input, Modal, Table, Space, Popconfirm, message } from "antd";

type Row = { key: string; code: string; name: string; yearCode: string };

export default function HocKy() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [rows, setRows] = useState<Row[]>([
    { key: "HK1-2425", code: "HK1-2425", name: "Học kỳ I", yearCode: "NH2425" },
    { key: "HK2-2425", code: "HK2-2425", name: "Học kỳ II", yearCode: "NH2425" },
  ]);
  const [form] = Form.useForm<Row>();

  const onCreate = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const onEdit = (r: Row) => { setEditing(r); form.setFieldsValue(r); setOpen(true); };
  const onDelete = (key: string) => { setRows(prev => prev.filter(x => x.key !== key)); message.success("Đã xoá"); };

  const submit = async () => {
    const v = await form.validateFields();
    if (editing) {
      setRows(prev => prev.map(x => (x.key === editing.key ? { ...editing, ...v } : x)));
      message.success("Đã cập nhật");
    } else {
      setRows(prev => [{ ...v, key: v.code }, ...prev]); // key = code
      message.success("Đã tạo");
    }
    setOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Quản lý học kỳ</h2>
        <Button type="primary" onClick={onCreate}>Thêm học kỳ</Button>
      </div>

      <Table
        rowKey="key"
        columns={[
          { title: "Mã", dataIndex: "code" },
          { title: "Tên học kỳ", dataIndex: "name" },
          { title: "Năm học", dataIndex: "yearCode" },
          {
            title: "Thao tác",
            render: (_: any, r: Row) => (
              <Space>
                <Button size="small" onClick={() => onEdit(r)}>Sửa</Button>
                <Popconfirm title="Xoá học kỳ này?" onConfirm={() => onDelete(r.key)}>
                  <Button size="small" danger>Xoá</Button>
                </Popconfirm>
              </Space>
            )
          }
        ]}
        dataSource={rows}
      />

      <Modal title={editing ? "Sửa học kỳ" : "Thêm học kỳ"} open={open} onOk={submit} onCancel={() => setOpen(false)} okText="Lưu">
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="Tên học kỳ" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="yearCode" label="Mã năm học" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
