"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 rounded-full bg-blue-200 text-white p-2 shadow-lg transition-all duration-300 hover:bg-blue-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-label="Lên đầu trang"
    >
      <Image src="http://thainguyen.thaithuy.edu.vn/App/Corporate/images/btt2.png" alt="Lên đầu trang" width={24} height={24} />
    </button>
  );
}
