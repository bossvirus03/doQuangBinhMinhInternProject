import { Button, Card, Form, Input, Typography, message } from 'antd'
import { api } from '../../lib/api'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation() as any
  const from = location.state?.from?.pathname || '/'

  const onFinish = async (values: any) => {
    try {
      const res = await api.post('/auth/login', values)
      console.log(res);
      
      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user))
      message.success('Đăng nhập thành công!')
      navigate(from, { replace: true })
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Đăng nhập thất bại')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Card title="Đăng nhập" style={{ width: 360 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="admin@example.com" />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Đăng nhập
          </Button>
          <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>
            Tài khoản mẫu: admin@example.com / admin123 (nếu đã seed)
          </Typography.Paragraph>
        </Form>
      </Card>
    </div>
  )
}
