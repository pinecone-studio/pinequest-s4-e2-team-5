// animated loader (shown only when website is first opened)
"use client";
import { useFlowerLoaderAnimation } from "@/hooks/useFlowerLoaderAnimation";
import { useRef } from "react";

export default function FlowerLoader({
  setLoading,
}: {
  setLoading: (loading: boolean) => void;
}) {
  const svg1Ref = useRef<SVGSVGElement | null>(null);
  const svg2Ref = useRef<SVGSVGElement | null>(null);
  const circleRef = useRef<SVGPathElement | null>(null);

  const handleAnimationComplete = () => {
    setLoading(false);
  };

  useFlowerLoaderAnimation(
    svg1Ref,
    svg2Ref,
    circleRef,
    handleAnimationComplete,
  );

  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh w-full bg-neutral-900 gap-20">
      {/* Main math symbols (drawn with DrawSVG) */}
      <svg
        ref={svg1Ref}
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[300px] h-[300px]"
      >
        {/* Inline styles for stroke-dasharray (required for DrawSVG) */}
        <style>{`
          path, circle {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
          }
        `}</style>

        {/* π (pi) — дээд талд */}
        <path
          d="M76 46 H124 M89 48 V74 M111 48 V74"
          fill="none"
          stroke="#87C12F"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ∞ (хязгааргүй) — гол дүрс */}
        <path
          d="M100 105 C87 86 58 86 58 105 C58 124 87 124 100 105 C113 86 142 86 142 105 C142 124 113 124 100 105 Z"
          fill="none"
          stroke="#C88DF5"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* + (нэмэх) — зүүн доод */}
        <path
          d="M62 140 V164 M50 152 H74"
          fill="none"
          stroke="#FACF71"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* = (тэнцүү) — баруун доод */}
        <path
          d="M126 146 H150 M126 158 H150"
          fill="none"
          stroke="#FF9AAF"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      {/* Background Circle (scales up behind) */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <svg
          ref={svg2Ref}
          width="276"
          height="276"
          viewBox="0 0 276 276"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-96 h-96"
        >
          <path
            ref={circleRef}
            d="M129.345 3.58105C134.383 -0.527263 141.616 -0.527135 146.654 3.58105L157.915 12.7637C161.584 15.7545 166.469 16.7964 171.037 15.5615L185.027 11.7812C191.295 10.0875 197.89 13.0267 200.82 18.8193L207.431 31.8896C209.561 36.1002 213.584 39.0313 218.245 39.7695L232.622 42.0469C239.013 43.0593 243.824 48.4076 244.155 54.8691L244.912 69.6143C245.153 74.3078 247.626 78.6026 251.564 81.1689L263.865 89.1855C269.269 92.7081 271.482 99.5252 269.176 105.55L263.884 119.377C262.207 123.756 262.723 128.672 265.27 132.608L273.304 145.021C276.805 150.434 276.057 157.554 271.507 162.122L261.103 172.566C257.79 175.891 256.265 180.597 257 185.232L259.314 199.849C260.324 206.228 256.737 212.444 250.709 214.767L237.068 220.018C232.673 221.71 229.356 225.405 228.146 229.957L224.369 244.175C222.705 250.44 216.876 254.678 210.402 254.332L195.911 253.558C191.19 253.305 186.636 255.338 183.674 259.021L174.535 270.387C170.462 275.451 163.391 276.956 157.607 273.987L144.711 267.367C140.498 265.206 135.502 265.206 131.289 267.367L118.392 273.987C112.61 276.956 105.537 275.451 101.465 270.387L92.3262 259.021C89.3639 255.338 84.8097 253.305 80.0889 253.558L65.5977 254.332C59.1243 254.678 53.2951 250.44 51.6309 244.175L47.8535 229.957C46.6444 225.405 43.3266 221.71 38.9316 220.018L25.291 214.767C19.262 212.444 15.6753 206.227 16.6855 199.849L19 185.232C19.734 180.597 18.2096 175.891 14.8975 172.566L4.49219 162.122C-0.0575218 157.554 -0.804791 150.434 2.69727 145.021L10.7295 132.608C13.277 128.672 13.7922 123.756 12.1162 119.377L6.82324 105.55C4.5174 99.5252 6.73083 92.7081 12.1357 89.1855L24.4365 81.1689C28.3741 78.6026 30.8461 74.3076 31.0869 69.6143L31.8438 54.8691C32.1754 48.4077 36.9855 43.0594 43.377 42.0469L57.7549 39.7695C62.4158 39.0313 66.4385 36.1002 68.5684 31.8896L75.1797 18.8193C78.1097 13.0266 84.7058 10.0874 90.9736 11.7812L104.963 15.5615C109.532 16.7962 114.416 15.7546 118.084 12.7637L129.345 3.58105Z"
            stroke="#FACF71"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
}
