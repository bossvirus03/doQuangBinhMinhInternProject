import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Table,
  Tag,
  Select,
  DatePicker,
  message,
  Space,
  Popconfirm,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import { api } from "../../lib/api";
import dayjs from "dayjs";

const { Search } = Input;
const URL_SEARCH = "/hocsinh/search";
const URL_GV_SEARCH = "/giaovien/search";

type Lop = { Malop: string; Tenlop: string; Magv: string };
type Hocsinh = {
  Mahs: string;
  Hotenhs: string;
  Gioitinh: "NAM" | "NU" | "KHAC";
  Malop?: string;
  Lop?: Lop | null;
  Diachi?: string;
  Ngaysinh: string;
};

type Giaovien = { Magv: string; Hotengv: string };

type Meta = {
  total: number;
  page: number;
  limit: number;
  sortBy?: string;
  order?: "asc" | "desc";
};

export default function HocSinh() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Hocsinh[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm<any>();
  const [gvList, setGvList] = useState<Giaovien[]>([]);

  // search + paging + sort
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortBy, setSortBy] = useState<keyof Hocsinh | "Mahs">("Mahs");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const typingRef = useRef<number | undefined>(undefined);

  const gvMap = useMemo(() => {
    const m: Record<string, string> = {};
    gvList.forEach((g) => (m[g.Magv] = g.Hotengv));
    return m;
  }, [gvList]);

  const fetchData = async (
    _q = q,
    _page = page,
    _limit = limit,
    _sortBy = sortBy,
    _order = order
  ) => {
    setLoading(true);
    try {
      const [hsRes, gvRes] = await Promise.all([
        api.get(URL_SEARCH, {
          params: { q: _q, page: _page, limit: _limit, sortBy: _sortBy, order: _order },
        }),
        api.get(URL_GV_SEARCH, { params: { page: 1, limit: 1000 } }),
      ]);
      const data = hsRes.data?.data ?? hsRes.data?.items ?? [];
      const meta: Meta | undefined = hsRes.data?.meta;
      setRows(data);
      setTotal(meta?.total ?? data.length);

      const gvData = gvRes.data?.data ?? gvRes.data?.items ?? [];
      setGvList(gvData);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Lỗi tải học sinh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData("", 1, limit, "Mahs", "asc");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (typingRef.current) window.clearTimeout(typingRef.current);
    typingRef.current = window.setTimeout(() => {
      setQ(v);
      setPage(1);
      fetchData(v, 1, limit, sortBy, order);
    }, 400);
  };

  const onTableChange = (
    pagination: TablePaginationConfig,
    _filters: any,
    sorter: SorterResult<Hocsinh> | SorterResult<Hocsinh>[]
  ) => {
    const p = pagination.current || 1;
    const ps = pagination.pageSize || 50;

    let sBy: string = sortBy;
    let sOrd: "asc" | "desc" = order;

    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    if (s && s.field) {
      sBy = String(s.field);
      sOrd = s.order === "ascend" ? "asc" : "desc";
    }

    setPage(p);
    setLimit(ps);
    setSortBy(sBy as any);
    setOrder(sOrd);
    fetchData(q, p, ps, sBy as any, sOrd);
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setOpen(true);
  };

  const handleEdit = (r: Hocsinh) => {
    setEditingId(r.Mahs);
    form.setFieldsValue({
      ...r,
      Ngaysinh: r.Ngaysinh ? dayjs(r.Ngaysinh) : undefined,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/hocsinh/${id}`);
      message.success("Đã xóa học sinh");
      await fetchData(q, page, limit, sortBy, order);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    const v = await form.validateFields();
    const payload = {
      Mahs: v.Mahs,
      Hotenhs: v.Hotenhs,
      Gioitinh: v.Gioitinh,
      Malop: v.Malop,
      Diachi: v.Diachi,
      Ngaysinh: v.Ngaysinh ? dayjs(v.Ngaysinh).toISOString() : undefined,
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/hocsinh/${editingId}`, payload);
        message.success("Đã cập nhật học sinh");
      } else {
        await api.post("/hocsinh", payload);
        message.success("Đã thêm học sinh");
      }
      setOpen(false);
      await fetchData(q, page, limit, sortBy, order);
    } finally {
      setSaving(false);
    }
  };

  const renderSex = (g: Hocsinh["Gioitinh"]) =>
    g === "NAM" ? (
      <Tag color="blue">Nam</Tag>
    ) : g === "NU" ? (
      <Tag color="magenta">Nữ</Tag>
    ) : (
      <Tag>Khác</Tag>
    );

  const columns: ColumnsType<Hocsinh> = [
    { title: "Mã HS", dataIndex: "Mahs", width: 100, sorter: true },
    { title: "Họ tên", dataIndex: "Hotenhs", width: 160, sorter: true },
    {
      title: "Giới tính",
      dataIndex: "Gioitinh",
      width: 100,
      render: renderSex,
    },
    {
      title: "Ngày sinh",
      dataIndex: "Ngaysinh",
      width: 130,
      sorter: true,
      render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY") : "—"),
    },
    {
      title: "Lớp",
      dataIndex: "Lop",
      width: 140,
      render: (_: Lop | undefined, r: Hocsinh) =>
        r.Lop?.Tenlop || r.Malop || "—",
    },
    { title: "Địa chỉ", dataIndex: "Diachi", ellipsis: true },
    {
      title: "Giáo viên chủ nhiệm",
      key: "GVCN",
      width: 220,
      render: (_: any, r: Hocsinh) => {
        const magv = r.Lop?.Magv;
        if (!magv) return <Tag>Chưa có</Tag>;
        const name = gvMap[magv];
        return <Tag color="green">{name ? `${name} (${magv})` : magv}</Tag>;
      },
    },
    {
      title: "Hành động",
      width: 180,
      fixed: "right",
      render: (_: any, r: Hocsinh) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(r)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa học sinh?"
            description={`Bạn chắc chắn muốn xóa ${r.Hotenhs}?`}
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            onConfirm={() => handleDelete(r.Mahs)}
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-semibold">Quản lý học sinh</h2>
        <div className="flex gap-2">
          <Search
            placeholder="Tìm theo Mã HS / Họ tên / Lớp"
            allowClear
            onChange={onSearchChange}
            style={{ width: 320 }}
          />
          <Button type="primary" onClick={handleAdd}>
            Thêm học sinh
          </Button>
        </div>
      </div>

      <Table<Hocsinh>
        rowKey="Mahs"
        loading={loading}
        dataSource={rows}
        columns={columns}
        onChange={onTableChange}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Tổng ${t} bản ghi`,
        }}
      />

      <Modal
        title={editingId ? "Sửa học sinh" : "Thêm học sinh"}
        open={open}
        onOk={submit}
        onCancel={() => setOpen(false)}
        okText="Lưu"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="Mahs" label="Mã HS" rules={[{ required: true }]}>
            <Input disabled={!!editingId} />
          </Form.Item>
          <Form.Item name="Hotenhs" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="Gioitinh"
            label="Giới tính"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "NAM", label: "Nam" },
                { value: "NU", label: "Nữ" },
                { value: "KHAC", label: "Khác" },
              ]}
            />
          </Form.Item>
          <Form.Item name="Malop" label="Lớp">
            <Input placeholder="VD: 10A1" />
          </Form.Item>
          <Form.Item name="Diachi" label="Địa chỉ">
            <Input />
          </Form.Item>
          <Form.Item
            name="Ngaysinh"
            label="Ngày sinh"
            rules={[{ required: true }]}
          >
            <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
