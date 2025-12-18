"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiList } from "react-icons/pi";
import { Button } from "@/components/ui";

interface MenuLinkProps {
  lang: string;
}

export function MenuLink({ lang }: MenuLinkProps) {
  const pathname = usePathname();

  return (
    <Link
      href={`/${lang}/menu`}
      onClick={() => {
        // Store the current page as the return URL
        localStorage.setItem("menuReturnUrl", pathname);
      }}
    >
      <Button variant="tertiary" size="icon" className="bg-gray-100">
        <PiList className="size-4 text-gray-900" />
      </Button>
    </Link>
  );
}
