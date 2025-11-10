// src/pages/MonHoc.tsx
import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Table,
  message,
  Popconfirm,
  Space,
} from "antd";
import { api } from "../../lib/api";

type Monhoc = { Mamon: string; Tenmon: string; Magv?: string };

export default function MonHoc() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Monhoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm<Monhoc>();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/monhoc", { params: { page: 1, limit: 50 } });
      setRows(res.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = () => {
    form.resetFields();
    setEditingId(null);
    setOpen(true);
  };

  const handleEdit = (record: Monhoc) => {
    setEditingId(record.Mamon);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/monhoc/${id}`);
      message.success("Đã xóa môn học");
      await load();
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      if (editingId) {
        // update
        await api.put(`/monhoc/${editingId}`, v);
        message.success("Đã cập nhật môn học");
      } else {
        // add
        await api.post("/monhoc", v);
        message.success("Đã thêm môn học");
      }
      setOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Quản lý môn học</h2>
        <Button type="primary" onClick={handleAdd}>
          Thêm môn
        </Button>
      </div>

      <Table
        rowKey="Mamon"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: "Mã môn", dataIndex: "Mamon", width: 120 },
          { title: "Tên môn", dataIndex: "Tenmon" },
          {
            title: "Hành động",
            align: "center",
            width: 160,
            render: (_: any, record: Monhoc) => (
              <Space>
                <Button size="small" onClick={() => handleEdit(record)}>
                  Sửa
                </Button>
                <Popconfirm
                  title="Xóa môn học?"
                  description={`Bạn chắc chắn muốn xóa ${record.Tenmon}?`}
                  okText="Xóa"
                  okButtonProps={{ danger: true }}
                  cancelText="Hủy"
                  onConfirm={() => handleDelete(record.Mamon)}
                >
                  <Button size="small" danger>
                    Xóa
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editingId ? "Sửa môn học" : "Thêm môn học"}
        open={open}
        onOk={submit}
        onCancel={() => setOpen(false)}
        okText="Lưu"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="Mamon"
            label="Mã môn"
            rules={[{ required: true, message: "Vui lòng nhập mã môn" }]}
          >
            <Input disabled={!!editingId} />
          </Form.Item>

          <Form.Item
            name="Tenmon"
            label="Tên môn"
            rules={[{ required: true, message: "Vui lòng nhập tên môn" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
