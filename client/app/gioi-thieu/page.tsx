import Breadcrumbs from "@/components/Breadcrumbs";
import ElectronicGovernment from "@/components/ElectronicGovernment";

export default function GioiThieu(){
  return (
    <>
      <Breadcrumbs trail={[{name:'Trang chủ', href:'/'}, {name:'Giới thiệu'}]} />
      <div className="container-narrow mt-6 grid md:grid-cols-[2fr,1fr] gap-6">
        <article className="bg-white flex  flex-col items-center rounded-xl p-5 border shadow-sm">
          <h1 className="text-2xl font-semibold text-primary">Giới thiệu chung</h1>
          <p className="mt-3 text-gray-700 leading-7">
            Trường THCS Thái Nguyên   
          </p>
          <p>Địa chỉ:  Thôn Hà My - xã Thái Nguyên - Thái Thụy - Thái Bình</p>
          <p>Email:  thainguyen2@thaithuy.edu.vn</p>
          <p>Điện thoại: 02273721668</p>
        </article>
        <aside className="bg-white rounded-xl p-5 border shadow-sm">
          <ElectronicGovernment/>
        </aside>
      </div>
    </>
  )
}
