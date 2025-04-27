import { ConnectButton } from "@mysten/dapp-kit";
import Link from "next/link";

export default function Topbar() {
  return (
    <header className="flex flex-row justify-between w-full">
      <div>
        <Link href="/">
          <p className="text-2xl font-medium">OnChain dApp Store</p>
        </Link>
      </div>
      <ConnectButton />
    </header>
  );
}