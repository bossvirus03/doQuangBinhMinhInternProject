# thaithuy-edu-next (demo)

Next.js 14 + TailwindCSS mô phỏng giao diện http://thainguyen.thaithuy.edu.vn (không sao chép nội dung).

## Chạy dự án

```bash
pnpm i   # hoặc npm i / yarn
pnpm dev # hoặc npm run dev
# mở http://localhost:3000
```

## Build sản xuất

```bash
pnpm build && pnpm start
```

## Ghi chú
- Màu sắc, bố cục, chuyên mục được thiết kế gần giống. Hãy thay thế dữ liệu giả (`lib/data.ts`) bằng API thật/CMS.
- Không sử dụng thư viện carousel bên ngoài để giảm phụ thuộc; banner tĩnh + marquee thông báo.
- Có thể xuất bản lên Vercel bằng 1 click. 
