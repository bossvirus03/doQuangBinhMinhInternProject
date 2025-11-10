import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { Button, Form, Input, Modal, Select, Space, Table, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { User } from '../../types';

const { Search } = Input;
const URL_SEARCH = '/users/search';

type Meta = {
  total: number;
  page: number;
  limit: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
};

export default function Users() {
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form] = Form.useForm();

  // search + paging + sort
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<keyof User | 'createdAt'>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const typingRef = useRef<number | undefined>(undefined);

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
        params: { q: _q, page: _page, limit: _limit, sortBy: _sortBy, order: _order },
      });
      const items = res.data?.data ?? res.data;
      const meta: Meta | undefined = res.data?.meta;
      setData(items ?? []);
      setTotal(meta?.total ?? (items?.length ?? 0));
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Lỗi tải users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData('', 1, limit, 'createdAt', 'desc'); /* eslint-disable-next-line */ }, []);

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (typingRef.current) window.clearTimeout(typingRef.current);
    typingRef.current = window.setTimeout(() => {
      setQ(v);
      setPage(1);
      fetchData(v, 1, limit, sortBy, order);
    }, 400);
  };

  const handleNew = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const handleEdit = (u: User) => {
    setEditing(u);
    form.setFieldsValue({ ...u, password: '' });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Xóa người dùng?',
      onOk: async () => {
        try {
          await api.delete(`/users/${id}`);
          message.success('Đã xóa');
          fetchData(q, page, limit, sortBy, order);
        } catch (e: any) {
          message.error(e?.response?.data?.message || 'Xóa thất bại');
        }
      }
    });
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await api.patch(`/users/${editing.id}`, values);
        message.success('Đã cập nhật');
      } else {
        await api.post('/users', values);
        message.success('Đã tạo mới');
      }
      setOpen(false);
      fetchData(q, page, limit, sortBy, order);
    } catch { /* ignore */ }
  };

  const onTableChange = (
    pagination: TablePaginationConfig,
    _filters: any,
    sorter: SorterResult<User> | SorterResult<User>[]
  ) => {
    const p = pagination.current || 1;
    const ps = pagination.pageSize || 20;

    let sBy: string = sortBy;
    let sOrd: 'asc' | 'desc' = order;

    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    if (s && s.field) {
      sBy = String(s.field);
      sOrd = s.order === 'ascend' ? 'asc' : 'desc';
    }

    setPage(p);
    setLimit(ps);
    setSortBy(sBy as any);
    setOrder(sOrd);
    fetchData(q, p, ps, sBy as any, sOrd);
  };

  const columns: ColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: true },
    { title: 'Email', dataIndex: 'email', key: 'email', sorter: true },
    { title: 'Tên', dataIndex: 'name', key: 'name', sorter: true },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      sorter: true,
      render: (role) => {
        switch (role) {
          case 'ADMIN': return 'Quản trị viên';
          case 'TEACHER': return 'Giáo viên';
          default: return 'Người dùng';
        }
      }
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>Sửa</Button>
          <Button danger onClick={() => handleDelete(record.id)}>Xóa</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Search placeholder="Tìm theo email / tên / role" allowClear onChange={onSearchChange} style={{ width: 320 }} />
        <Button type="primary" onClick={handleNew}>Thêm người dùng</Button>
        <Button onClick={() => fetchData(q, page, limit, sortBy, order)} loading={loading}>Tải lại</Button>
      </Space>

      <Table<User>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
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
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSubmit}
        title={editing ? 'Sửa người dùng' : 'Thêm người dùng'}
        okText={editing ? 'Lưu' : 'Tạo mới'}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]} initialValue="USER">
            <Select
              options={[
                { value: 'USER', label: 'Người dùng' },
                { value: 'TEACHER', label: 'Giáo viên' },
                { value: 'ADMIN', label: 'Quản trị viên' },
              ]}
            />
          </Form.Item>

          <Form.Item name="password" label="Mật khẩu" rules={[{ required: !editing, min: 6 }]}>
            <Input.Password placeholder={editing ? '(để trống nếu không đổi)' : ''} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
