"use client";
import { Button } from "./ui/button";
import Link from "next/link";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

function Header() {
  const currentCount = useCurrentAccount();
  return (
    <header className="border-b border-gray-300 flex justify-between items-center h-20">
      <Link href="/">
        <div className="text-xl font-bold">QiDian on SUI</div>
      </Link>
      <div className="flex items-center gap-4">
        {currentCount && (
          <Link href="/home">
            <Button variant="default" className="cursor-pointer">
              My Space
            </Button>
          </Link>
        )}

        <ConnectButton />
      </div>
    </header>
  );
}

export default Header;
