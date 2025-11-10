import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { Button, Form, Input, Modal, Switch, Table, Upload, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import type { UploadRequestOption as RcCustomRequestOptions } from 'rc-upload/lib/interface';
import { NewsItem } from '@/types';

const { Search } = Input;
const URL_SEARCH = '/news/search';

type Meta = {
  total: number;
  page: number;
  limit: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
};

export default function TinTuc() {
  const [data, setData] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

  // search + paging + sort
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<keyof NewsItem | 'createdAt'>('createdAt');
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
      message.error(e?.response?.data?.message || 'Lỗi tải news');
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

  const handleEdit = (n: NewsItem) => {
    setEditing(n);
    form.setFieldsValue(n);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Xóa bài viết?',
      onOk: async () => {
        try {
          await api.delete(`/news/${id}`);
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
        await api.patch(`/news/${editing.id}`, values);
        message.success('Đã cập nhật');
      } else {
        await api.post(`/news`, values);
        message.success('Đã tạo bài');
      }
      setOpen(false);
      fetchData(q, page, limit, sortBy, order);
    } catch { /* ignore */ }
  };

  const onTableChange = (
    pagination: TablePaginationConfig,
    _filters: any,
    sorter: SorterResult<NewsItem> | SorterResult<NewsItem>[]
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

  const currentThumb: string | undefined = Form.useWatch('thumbnail', form);

  const customUpload = async (options: RcCustomRequestOptions) => {
    const { file, onSuccess, onError } = options;
    const fd = new FormData();
    fd.append('file', file as Blob);

    try {
      setUploading(true);
      const res = await api.post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res?.data?.url;
      if (!url) throw new Error('Upload không trả về url');

      form.setFieldsValue({ thumbnail: url });
      message.success('Tải ảnh thành công');
      onSuccess && onSuccess(res.data as any);
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.message || 'Upload thất bại');
      onError && onError(err);
    } finally {
      setUploading(false);
    }
  };

  const columns: ColumnsType<NewsItem> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, fixed: 'left', sorter: true },
    {
      title: 'Thumbnail',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
      width: 120,
      render: (url?: string) => (
        <img
          src={url || 'https://placehold.co/100x60?text=No+Img'}
          alt="thumb"
          style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #f0f0f0' }}
        />
      )
    },
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title', sorter: true },
    { title: 'Slug', dataIndex: 'slug', key: 'slug', sorter: true },
    {
      title: 'Công khai',
      dataIndex: 'published',
      key: 'published',
      width: 120,
      sorter: true,
      render: (v: boolean) => v ? '✅' : '❌'
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <>
          <Button onClick={() => handleEdit(record)} style={{ marginRight: 8 }}>Sửa</Button>
          <Button danger onClick={() => handleDelete(record.id)}>Xóa</Button>
        </>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Search
          placeholder="Tìm theo tiêu đề / slug / nội dung / tác giả"
          allowClear
          onChange={onSearchChange}
          style={{ width: 360 }}
        />
        <Button type="primary" onClick={handleNew} style={{ marginRight: 8 }}>Thêm bài</Button>
        <Button onClick={() => fetchData(q, page, limit, sortBy, order)} loading={loading}>Tải lại</Button>
      </div>

      <Table<NewsItem>
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
        title={editing ? 'Sửa bài viết' : 'Thêm bài viết'}
        okText={editing ? 'Lưu' : 'Tạo mới'}
        width={720}
      >
        <Form layout="vertical" form={form} initialValues={{ published: false }}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input placeholder="duong-dan-bai-viet" />
          </Form.Item>

          <Form.Item name="content" label="Nội dung" rules={[{ required: true }]}>
            <Input.TextArea rows={6} />
          </Form.Item>

          <Form.Item name="published" label="Công khai" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="thumbnail" label="Thumbnail URL">
            <Input placeholder="https://.../image.jpg" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Upload
              accept="image/*"
              maxCount={1}
              showUploadList={false}
              customRequest={customUpload}
            >
              <Button loading={uploading}>Upload thumbnail</Button>
            </Upload>

            <div style={{ width: 120, height: 72, border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
              <img
                src={currentThumb || 'https://placehold.co/120x72?text=Preview'}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
