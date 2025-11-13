// src/pages/LopHoc.tsx
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
  Select,
} from "antd";
import { api } from "../../lib/api";

type Lop = { Malop: string; Tenlop?: string; Magv?: string };
type Giaovien = { Magv: string; Hotengv: string };

export default function LopHoc() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Lop[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm<Lop>();
  const [gvList, setGvList] = useState<Giaovien[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [lopRes, gvRes] = await Promise.all([
        api.get("/lop", { params: { page: 1, limit: 50 } }),
        api.get("/teacher", { params: { page: 1, limit: 1000 } }),
      ]);
      setRows(lopRes.data.items);
      setGvList(gvRes.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setOpen(true);
  };

  const handleEdit = (record: Lop) => {
    setEditingId(record.Malop);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/lop/${id}`);
      message.success("Đã xóa lớp học");
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
        await api.patch(`/lop/${editingId}`, v);
        message.success("Đã cập nhật lớp học");
      } else {
        await api.post("/lop", v);
        message.success("Đã thêm lớp học");
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
        <h2 className="text-xl font-semibold">Quản lý lớp học</h2>
        <Button type="primary" onClick={handleAdd}>
          Thêm lớp
        </Button>
      </div>

      <Table
        rowKey="Malop"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: "Mã lớp", dataIndex: "Malop", width: 120 },
          { title: "Tên lớp", dataIndex: "Tenlop" },
          {
            title: "Giáo viên chủ nhiệm",
            dataIndex: "Magv",
            width: 220,
            render: (magv?: string) => {
              if (!magv) return "—";
              const gv = gvList.find((g) => g.Magv === magv);
              return gv ? `${gv.Hotengv} (${magv})` : magv;
            },
          },
          {
            title: "Hành động",
            align: "center",
            width: 180,
            render: (_: any, record: Lop) => (
              <Space>
                <Button size="small" onClick={() => handleEdit(record)}>
                  Sửa
                </Button>
                <Popconfirm
                  title="Xóa lớp học?"
                  description={`Bạn chắc chắn muốn xóa ${
                    record.Tenlop || record.Malop
                  }?`}
                  okText="Xóa"
                  okButtonProps={{ danger: true }}
                  cancelText="Hủy"
                  onConfirm={() => handleDelete(record.Malop)}
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
        title={editingId ? "Sửa lớp học" : "Thêm lớp học"}
        open={open}
        onOk={submit}
        onCancel={() => setOpen(false)}
        okText="Lưu"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="Malop"
            label="Mã lớp"
            rules={[{ required: true, message: "Vui lòng nhập mã lớp" }]}
          >
            <Input disabled={!!editingId} />
          </Form.Item>
          <Form.Item name="Tenlop" label="Tên lớp">
            <Input />
          </Form.Item>
          <Form.Item name="Magv" label="Giáo viên chủ nhiệm (Magv)">
            <Select
              allowClear
              showSearch
              placeholder="Chọn giáo viên..."
              options={gvList.map((g) => ({
                label: `${g.Hotengv} (${g.Magv})`,
                value: g.Magv,
              }))}
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
