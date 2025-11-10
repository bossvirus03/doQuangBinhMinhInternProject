"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Form, Input, Button, Checkbox, message } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type LoginResponse = {
  access_token: string; // NestJS thường trả { access_token }
  user?: {              // nếu BE có trả kèm user thì tận dụng luôn
    name?: string;
    email?: string;
    avatarUrl?: string | null;
  };
};

export default function Login() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Tự điền email đã nhớ
  useEffect(() => {
    const savedEmail = localStorage.getItem("remember_email");
    if (savedEmail) form.setFieldsValue({ email: savedEmail, remember: true });
  }, [form]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      // 1) Đăng nhập lấy token
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? `Đăng nhập thất bại (HTTP ${res.status})`);
      }

      const data: LoginResponse = await res.json();
      const token =
        data?.access_token || (data as any)?.accessToken || (data as any)?.token;

      if (!token) throw new Error("Không nhận được token");

      // 2) Lưu token
      localStorage.setItem("token", token);

      // 3) Lấy thông tin người dùng (ưu tiên từ /users/me để luôn mới nhất)
      let user = data.user
        ? {
            name: data.user.name ?? "",
            email: data.user.email ?? values.email,
            avatar: data.user.avatarUrl ?? null,
          }
        : null;

      try {
        const meRes = await fetch(`${API}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (meRes.ok) {
          const me = await meRes.json();
          user = {
            name: me?.name ?? user?.name ?? "",
            email: me?.email ?? user?.email ?? values.email,
            avatar: me?.avatarUrl ?? user?.avatar ?? null,
          };
        }
      } catch {
        // nếu gọi me lỗi, dùng tạm user từ login (nếu có)
      }

      // 4) Lưu user vào localStorage để Header hiển thị avatar + email ngay
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        // fallback nếu không có gì
        localStorage.setItem(
          "user",
          JSON.stringify({ name: values.email.split("@")[0], email: values.email, avatar: null })
        );
      }
      // Phát sự kiện cho cùng tab (Header nghe để cập nhật ngay)
      window.dispatchEvent(new StorageEvent("storage", { key: "user" }));

      // 5) Remember email
      if (values.remember) localStorage.setItem("remember_email", values.email);
      else localStorage.removeItem("remember_email");

      message.success("Đăng nhập thành công!");
      router.replace("/");
    } catch (e: any) {
      message.error(e?.message ?? "Có lỗi xảy ra khi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-235px)] flex items-center justify-center bg-gradient-to-r from-white to-blue-100">
      <div className="flex bg-white shadow-lg rounded-2xl overflow-hidden w-[900px] max-w-full">
        {/* Left Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Đăng nhập</h2>

          <Form form={form} layout="vertical" onFinish={onFinish} className="flex flex-col gap-2">
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="you@example.com" size="large" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" size="large" />
            </Form.Item>

            <div className="flex justify-between items-center mb-2">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Ghi nhớ email</Checkbox>
              </Form.Item>

              <Link href="/auth/forgot-password" className="text-blue-600 hover:underline text-sm">
                Quên mật khẩu?
              </Link>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-blue-600"
                size="large"
                loading={loading}
              >
                Đăng nhập
              </Button>
            </Form.Item>

            <div className="text-center text-gray-500 mb-2">Hoặc</div>

            <Link
              href="https://id.nentanggiaoduc.edu.vn/Account/Login?returnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fresponse_type%3Dcode%26client_id%3Dportal_client%26redirect_uri%3Dhttp%253A%252F%252Fthainguyen.thaithuy.edu.vn%252Fapi%252FConnect%252FEduSSO%252FUser%252Flogin%26state%3D1aee686374%26scope%3Dopenid%2520profile%2520offline_access%2520esmartup%26code_challenge%3DnbcNKFEq4WeLHIi9x1xa3huFSaNxgKrbQIE0vUcaC8E%26code_challenge_method%3DS256"
              className="w-full"
            >
              <Button type="default" className="w-full bg-sky-400 text-white font-semibold hover:bg-sky-500" size="large">
                Đăng nhập bằng tài khoản SSO
              </Button>
            </Link>
          </Form>
        </div>

        {/* Right image */}
        <div className="hidden md:flex w-1/2 bg-blue-50 items-center justify-center p-8">
          <img
            src="http://thainguyen.thaithuy.edu.vn/Core/Home/images/Login/image-login-default.png"
            alt="Login Illustration"
            className="max-w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
}
