import { ConnectButton } from "@mysten/dapp-kit";
import Link from "next/link";

export default function Topbar() {
  return (
    <header className="flex flex-row justify-between w-full">
      <div>
        <Link href="/">
          <p className="text-2xl font-medium">链上应用商店</p>
        </Link>
      </div>
      <ConnectButton />
    </header>
  );
}