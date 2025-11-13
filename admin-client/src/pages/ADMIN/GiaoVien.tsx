import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Table,
  Tag,
  message,
  DatePicker,
  Select,
  Popconfirm,
  Space,
} from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { SorterResult } from "antd/es/table/interface";
import { api } from "../../lib/api";
import dayjs from "dayjs";

const { Search } = Input;
const URL_SEARCH = "/teacher/search";
const URL_LOP = "/lop";
const URL_MON = "/monhoc";

type LopChuNhiem = { Malop: string; Tenlop: string; Magv: string };
type MonPT = { Mamon: string; Tenmon: string; Magv: string };

type Giaovien = {
  Magv: string;
  Hotengv: string;
  Email?: string;
  SDT?: string;
  Ngaysinh?: string;
  Gioitinh?: "NAM" | "NU" | "KHAC";
  ChuNhiem?: LopChuNhiem[];
  MonPhuTrach?: MonPT[];
  Giangdays?: Array<{
    Malop: string;
    Mamon: string;
    Namhoc: number;
    Hocky: string;
  }>;
};

type Option = { label: string; value: string };

type Meta = {
  total: number;
  page: number;
  limit: number;
  sortBy?: string;
  order?: "asc" | "desc";
};

export default function GiaoVien() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Giaovien[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lopOptions, setLopOptions] = useState<Option[]>([]);
  const [monOptions, setMonOptions] = useState<Option[]>([]);
  const [form] = Form.useForm<any>();

  // search + paging + sort
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortBy, setSortBy] = useState<keyof Giaovien | "Magv">("Magv");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const typingRef = useRef<number | undefined>(undefined);

  const sexTag = (g?: Giaovien["Gioitinh"]) => {
    switch (g) {
      case "NAM":
        return <Tag color="blue">Nam</Tag>;
      case "NU":
        return <Tag color="magenta">Nữ</Tag>;
      case "KHAC":
        return <Tag>Khác</Tag>;
      default:
        return <Tag>—</Tag>;
    }
  };

  const fetchOptions = async () => {
    const [lopRes, monRes] = await Promise.all([
      api.get(URL_LOP, { params: { page: 1, limit: 1000 } }),
      api.get(URL_MON, { params: { page: 1, limit: 1000 } }),
    ]);
    const lopItems = (lopRes.data.items ?? []).map((l: any) => ({
      label: l.Tenlop || l.Malop,
      value: l.Malop,
    })) as Option[];
    const monItems = (monRes.data.items ?? []).map((m: any) => ({
      label: m.Tenmon || m.Mamon,
      value: m.Mamon,
    })) as Option[];
    setLopOptions(lopItems);
    setMonOptions(monItems);
  };

  const fetchData = async (
    _q = q,
    _page = page,
    _limit = limit,
    _sortBy = sortBy,
    _order = order
  ) => {
    setLoading(true);
    try {
      const res = await api.get(URL_SEARCH, {
        params: {
          q: _q,
          page: _page,
          limit: _limit,
          sortBy: _sortBy,
          order: _order,
        },
      });
      const data = res.data?.data ?? res.data?.items ?? [];
      const meta: Meta | undefined = res.data?.meta;
      setRows(data);
      setTotal(meta?.total ?? data.length);
    } catch (e: any) {
      message.error(
        e?.response?.data?.message || "Lỗi tải danh sách giáo viên"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchData("", 1, limit, "Magv", "asc");
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
    sorter: SorterResult<Giaovien> | SorterResult<Giaovien>[]
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

  const handleEdit = (r: Giaovien) => {
    setEditingId(r.Magv);
    form.setFieldsValue({
      Magv: r.Magv,
      Hotengv: r.Hotengv,
      Email: r.Email,
      SDT: r.SDT,
      Gioitinh: r.Gioitinh,
      Ngaysinh: r.Ngaysinh
        ? dayjs(r.Ngaysinh).isValid()
          ? dayjs(r.Ngaysinh)
          : undefined
        : undefined,
      ChuNhiemMalop: r.ChuNhiem?.map((c) => c.Malop) ?? [],
      MonPhuTrachMamon: r.MonPhuTrach?.map((m) => m.Mamon) ?? [],
      LopPhuTrachMalop: Array.from(
        new Set((r.Giangdays || []).map((g) => g.Malop))
      ),
    });
    setOpen(true);
  };

  const submit = async () => {
    const v = await form.validateFields();
    const payload = {
      Magv: v.Magv,
      Hotengv: v.Hotengv,
      Email: v.Email,
      SDT: v.SDT,
      Gioitinh: v.Gioitinh,
      Ngaysinh: v.Ngaysinh ? dayjs(v.Ngaysinh).toISOString() : undefined,
      ChuNhiemMalop: v.ChuNhiemMalop ?? [],
      MonPhuTrachMamon: v.MonPhuTrachMamon ?? [],
      LopPhuTrachMalop: v.LopPhuTrachMalop ?? [],
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/teacher/${editingId}`, payload);
        message.success("Đã cập nhật giáo viên");
      } else {
        const createPayload = {
          ...payload,
          ...(v.Password ? { Password: v.Password } : {}),
        };
        await api.post("/teacher", createPayload);
        message.success("Đã thêm giáo viên");
      }
      setOpen(false);
      await fetchData(q, page, limit, sortBy, order);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/teacher/${id}`);
      message.success("Đã xóa giáo viên");
      await fetchData(q, page, limit, sortBy, order);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Giaovien> = [
    { title: "Mã GV", dataIndex: "Magv", width: 120, sorter: true },
    { title: "Họ tên", dataIndex: "Hotengv", sorter: true },
    { title: "Email", dataIndex: "Email", sorter: true },
    { title: "SĐT", dataIndex: "SDT", width: 130 },
    {
      title: "Giới tính",
      dataIndex: "Gioitinh",
      width: 110,
      render: (_: any, r) => sexTag(r.Gioitinh),
    },
    {
      title: "Ngày sinh",
      dataIndex: "Ngaysinh",
      width: 140,
      sorter: true,
      render: (val: string | undefined) =>
        val ? dayjs(val).format("DD/MM/YYYY") : "—",
    },
    {
      title: "Chủ nhiệm",
      dataIndex: "ChuNhiem",
      render: (list: LopChuNhiem[] | undefined) =>
        list && list.length > 0 ? (
          <>
            {list.map((c) => (
              <Tag key={c.Malop} color="gold">
                {c.Tenlop || c.Malop}
              </Tag>
            ))}
          </>
        ) : (
          <Tag>Không</Tag>
        ),
    },
    {
      title: "Môn phụ trách",
      dataIndex: "MonPhuTrach",
      render: (list: MonPT[] | undefined) =>
        list && list.length > 0 ? (
          <>
            {list.map((m) => (
              <Tag key={m.Mamon} color="green">
                {m.Tenmon || m.Mamon}
              </Tag>
            ))}
          </>
        ) : (
          <Tag>—</Tag>
        ),
    },
    {
      title: "Hành động",
      fixed: "right",
      width: 180,
      render: (_: any, r) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(r)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa giáo viên?"
            description={`Bạn chắc chắn muốn xóa ${r.Hotengv}?`}
            okText="Xóa"
            okButtonProps={{ danger: true }}
            cancelText="Hủy"
            onConfirm={() => handleDelete(r.Magv)}
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
        <h2 className="text-xl font-semibold">Quản lý giáo viên</h2>
        <div className="flex gap-2">
          <Search
            placeholder="Tìm theo Mã GV / Họ tên / Email"
            allowClear
            onChange={onSearchChange}
            style={{ width: 320 }}
          />
          <Button type="primary" onClick={handleAdd}>
            Thêm giáo viên
          </Button>
        </div>
      </div>

      <Table<Giaovien>
        rowKey="Magv"
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
        title={editingId ? "Sửa giáo viên" : "Thêm giáo viên"}
        open={open}
        onOk={submit}
        confirmLoading={saving}
        onCancel={() => setOpen(false)}
        okText="Lưu"
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="Magv" label="Mã GV" rules={[{ required: true }]}>
            <Input disabled={!!editingId} />
          </Form.Item>
          <Form.Item name="Hotengv" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="Email" label="Email">
            <Input type="email" />
          </Form.Item>
          {!editingId && (
            <Form.Item
              name="Password"
              label="Mật khẩu ban đầu"
              tooltip="Để trống để dùng mật khẩu mặc định: teacher{Mã GV}"
              rules={[{ min: 6, message: "Ít nhất 6 ký tự" }]}
            >
              <Input.Password placeholder="Nhập mật khẩu (tùy chọn)" />
            </Form.Item>
          )}
          <Form.Item name="SDT" label="SĐT">
            <Input />
          </Form.Item>

          <Form.Item name="Gioitinh" label="Giới tính">
            <Select
              options={[
                { value: "NAM", label: "Nam" },
                { value: "NU", label: "Nữ" },
                { value: "KHAC", label: "Khác" },
              ]}
            />
          </Form.Item>

          <Form.Item name="Ngaysinh" label="Ngày sinh">
            <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="ChuNhiemMalop"
            label="Lớp chủ nhiệm"
            tooltip="Chọn các lớp đang/đã chủ nhiệm"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Chọn lớp…"
              options={lopOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            name="MonPhuTrachMamon"
            label="Môn phụ trách"
            tooltip="Chọn các môn đang giảng dạy"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Chọn môn…"
              options={monOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            name="LopPhuTrachMalop"
            label="Lớp phụ trách"
            tooltip="Chọn các lớp đang giảng dạy (màn này chỉ chọn lớp; tạo lịch giảng dạy chi tiết ở phần Giảng dạy)"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Chọn lớp…"
              options={lopOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
