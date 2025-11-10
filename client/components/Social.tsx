import Link from 'next/link'
import Image from 'next/image'

export default function Social() {
  return (
                <div className="px-5 pb-5 grid grid-cols-2 gap-4">
                  {[
                    { label: "Hệ thống V Office", href: "Hệ thống V.Office", thumbnail: "http://thainguyen.thaithuy.edu.vn/publish/thumbnail/19083/480x480xdefault/upload/19083/20170713/qly-vb.png" },
                    { label: "Hệ thống Email", href: "https://mail.google.com/mail/u/0/?pli=1#inbox", thumbnail: "http://thainguyen.thaithuy.edu.vn/publish/thumbnail/37883/480x480xdefault/upload/37883/20200905/gmail-computer-icons-email-logo-gmail_12c575f595.jpg" },
                    { label: "Facebook nhà trường" , href: "https://www.facebook.com/profile.php?id=100063709736786#", thumbnail: "http://thainguyen.thaithuy.edu.vn/publish/thumbnail/37883/480x480xdefault/upload/37883/20200905/facebook_logos_PNG19751_eb75259416.png" },
                    { label: "Hệ thống Email giáo dục" , href: "https://login.microsoftonline.com/login.srf?wa=wsignin1.0&amp;amp;rpsnv=2&amp;amp;ct=1376463820&amp;amp;rver=6.1.6206.0&amp;amp;wp=MCMBI&amp;amp;wreply=https:%2F%2Fportal.microsoftonline.com%2Flanding.aspx%3Ftarget%3D%252fdefault.aspx%253flc%253d1066&amp;amp;lc=1033&amp;amp;id=271346", thumbnail: "http://thainguyen.thaithuy.edu.vn/publish/thumbnail/19083/480x480xdefault/upload/19083/20170713/mai-convu68.png" },
                    { label: "Hồ sơ điện tử" , href: "tin-tuc/hoat-dong-chuyen-mon/ho-so-dien-tu-truong-th-thcs-thai-nguyen.html", thumbnail: "http://thainguyen.thaithuy.edu.vn/publish/thumbnail/37883/480x480xdefault/upload/37883/20221002/unnamed_1__5c1b56da35_37002.png" },
                    { label: "Hệ thống quản lý nhà trường" , href: "https://vanban.edu.vn", thumbnail: "http://thainguyen.thaithuy.edu.vn/publish/thumbnail/19083/480x480xdefault/upload/19083/20170713/truong-hoc-ket-noi.png" },
                  ].map((x, i) => (
                    <Link
                      key={i}
                      href={x.href}
                      className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-gray-50"
                    >
                      <Image alt={x.label} src={x.thumbnail} width={40} height={40} className="rounded-lg border" />
                      <div className="text-center text-xs text-gray-700">
                        {x.label}
                      </div>
                    </Link>
                  ))}
                </div>
  )
}
