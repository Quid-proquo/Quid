'use client'

import { useWalletProvider } from "@/context/WalletProvider"
import Image from "next/image";
import WalletKit from "@/lib/stellar-wallets-kit"
import { useEffect, useMemo, useState } from "react";
import { ISupportedWallet } from "@creit-tech/stellar-wallets-kit";
import { div } from "framer-motion/client";
import { useRouter } from "next/navigation";
import { OctagonAlert } from "lucide-react"

export default function ConnectWalletPage() {

    const { connect, isConnected, getAvailableWallets } = useWalletProvider();

    const [availableWallets, setAvailableWallets] = useState<ISupportedWallet[]>([]);
    const [selectedWallet, setSelectedWallet] = useState<ISupportedWallet>()

    useEffect(() => {
        const listAvailableWallets = async () => {
            const list = await getAvailableWallets();
            setAvailableWallets(list);
        }

        listAvailableWallets()
    }, []);

    const { push } = useRouter();

    const handleConnect = async () => {
        const address = await connect();
        console.log(address);

        if (address && address !== "" && isConnected) {
            // Change this later to desired page
            push("/account-type")
        }
    }

    return (
        <div className="min-h-screen bg-[#0b0a11] text-white grid place-items-center">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(75%_120%_at_50%_-5%,rgba(124,44,255,0.45)_0%,rgba(12,10,20,0.2)_55%,rgba(8,8,12,0.96)_100%)]" />
            </div>

            <div className="flex flex-col items-center">
                <Image
                    src="/Quid Logo.png"
                    alt="Quid Logo"
                    width={28}
                    height={28}
                    className="h-7 w-12 mr-2"
                    priority
                />

                <div className="flex flex-col items-center mt-20">
                    <p className="text-3xl text-white">Connect a wallet</p>
                    <p className="text-sm text-gray-500">Choose a wallet and Connect</p>
                </div>

                <div className="flex flex-col gap-6 w-80 bg-transparent backdrop-blur-md border border-white/10 shadow-xl rounded-2xl pt-4 mt-10">
                    <div className="flex flex-col gap-y-3">
                        {availableWallets.map((wallet, id) => {
                            return (
                                <div 
                                    key={wallet.id} 
                                    className="flex px-2 py-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/10 shadow-xl justify-between w-72 mx-auto"
                                    onClick={handleConnect}
                                >
                                    <div className="flex gap-x-4">
                                        <img 
                                            src={wallet.icon}
                                            alt={wallet.name}
                                            height={25}
                                            width={25}
                                        />
                                        <p>
                                            {wallet.name}
                                        </p>
                                    </div>

                                    <div className="">
                                        <span className="group-hover:text-blue-400 text-xs text-white/40">Connect →</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="bg-black/65 rounded-b-2xl px-2 py-3">
                        <p className="text-[11px] text-center text-gray-600">
                            By connecting your wallet, you are agreeing to our <a className="font-bold text-gray-200">Terms and Conditions</a> and our <a className="font-bold text-gray-200">Privacy Policy</a>
                        </p>
                    </div>
                </div>

                <div className="mt-8 w-80 border rounded-md border-pink-300 mx-auto py-4 flex gap-2 items-center px-2">
                    <OctagonAlert className="text-2xl text-pink-300"/>
                    <p className="text-[10px]">
                        Quid will never ask for your private keys or seed phrases. Only connect wallets you trust and control
                    </p>
                </div>
            </div>
        </div>
    )
}