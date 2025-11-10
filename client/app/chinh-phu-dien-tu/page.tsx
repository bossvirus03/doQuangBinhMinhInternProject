import Breadcrumbs from "@/components/Breadcrumbs";
import ElectronicGovernment from "@/components/ElectronicGovernment";

const directives = [
  { id: 1, title: "Chỉ đạo thực hiện chuyên đề tháng 10" },
  { id: 2, title: "Triển khai nhiệm vụ trọng tâm quý IV" },
  { id: 3, title: "An toàn thông tin trong trường học" }
];

export default function ChinhPhuDienTu(){
  return (
    <>
      <Breadcrumbs trail={[{name:'Trang chủ', href:'/'}, {name:'Chính phủ điện tử'}]} />
       <div className="container-narrow mt-6 grid md:grid-cols-[2fr,1fr] gap-6">
              <article className="bg-white flex  flex-col items-center rounded-xl p-5 border shadow-sm"></article>
              <aside className="bg-white rounded-xl p-5 border shadow-sm">
                <ElectronicGovernment/>
              </aside>
            </div>
    </>
  )
}
