"use client";

import React, { useEffect, useState } from "react";
import { Form, Input, Button, Radio, Steps, message, Card, Tooltip, Spin } from "antd";
import { UserOutlined, LockOutlined, ReloadOutlined, SafetyOutlined } from "@ant-design/icons";

export default function ForgotPassword() {
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();

  // Nếu FE và API cùng origin, để trống:
  const API = ""; // hoặc process.env.NEXT_PUBLIC_API_BASE
  const buildUrl = () => `${API}/api/captcha?ts=${Date.now()}`;

  const [captchaUrl, setCaptchaUrl] = useState<string>("");
  const [captchaLoading, setCaptchaLoading] = useState(true);

  // Preload helper
  const loadCaptcha = (url: string) => {
    setCaptchaLoading(true);
    const img = new Image();
    img.onload = () => {
      setCaptchaUrl(url);       // chỉ gán khi chắc chắn load xong
      setCaptchaLoading(false);
    };
    img.onerror = () => {
      setCaptchaLoading(false);
      message.error("Không tải được captcha, thử lại!");
    };
    img.src = url;
  };

  const refreshCaptcha = () => {
    loadCaptcha(buildUrl());
  };

  useEffect(() => {
    refreshCaptcha(); // load lần đầu
  }, []);

  const onFinish = (values: any) => {
    console.log(values);
    message.success("Gửi yêu cầu thành công!");
    setStep(1);
  };

  return (
    <div className="h-[calc(100vh-235px)] flex items-center justify-center">
      <Card className="w-[420px] shadow-xl rounded-xl" title={<h2 className="text-center text-lg font-semibold">Quên mật khẩu</h2>}>
        <Steps
          current={step}
          size="small"
          items={[
            { title: "Tài khoản", icon: <UserOutlined /> },
            { title: "Xác nhận", icon: <LockOutlined /> },
          ]}
          className="mb-6"
        />

        {step === 0 ? (
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ method: "email" }}>
            <Form.Item label="Tên tài khoản" name="username" rules={[{ required: true, message: "Vui lòng nhập tài khoản!" }]}>
              <Input placeholder="adv@gmail.com" size="large" />
            </Form.Item>

            <Form.Item
              label="Bạn muốn nhận mã đặt lại mật khẩu bằng cách nào?"
              name="method"
              rules={[{ required: true, message: "Hãy chọn cách nhận mã!" }]}
            >
              <Radio.Group>
                <Radio value="email">Lấy lại mật khẩu bằng email</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="Mã bảo mật"
              name="captcha"
              rules={[{ required: true, message: "Vui lòng nhập mã bảo mật!" }]}
            >
              <div className="flex items-center gap-2">
                <div className="relative w-[110px] h-[40px] flex items-center justify-center border rounded overflow-hidden">
                  {captchaLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <Spin size="small" />
                    </div>
                  )}
                  {/* Khi preload xong mới render <img> nên không phụ thuộc onLoad của thẻ này */}
                  {captchaUrl && (
                    <img
                      src={captchaUrl}
                      alt="Captcha"
                      width={100}
                      height={35}
                      draggable={false}
                    />
                  )}
                </div>

                  <Button
                    type="text"
                    icon={<ReloadOutlined />}
                    onClick={refreshCaptcha}
                    loading={captchaLoading}
                    aria-label="Làm mới captcha"
                    title="Làm mới mã bảo mật"
                  />

                <Input placeholder="Nhập mã" className="flex-1" />
              </div>
            </Form.Item>

            <div className="flex justify-end gap-2">
              <Button>Hủy</Button>
              <Button type="primary" htmlType="submit">
                Tiếp theo
              </Button>
            </div>
          </Form>
        ) : (
          <div className="text-center py-8">
            <SafetyOutlined className="text-4xl text-blue-500 mb-4" />
            <p className="text-gray-600">
              Mã xác nhận đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư và làm theo hướng dẫn để đặt lại mật khẩu.
            </p>
            <Button type="primary" className="mt-4" onClick={() => setStep(0)}>
              Quay lại
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
