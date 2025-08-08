import Image, { type ImageProps } from "next/image";
import { Button } from "@/components/ui/button";
import PanoramaThree from "@repo/threejs/panorama-three";
export default function Page() {
  return (
    <div className=" w-full h-full">
      <PanoramaThree />
    </div>
  );
}
