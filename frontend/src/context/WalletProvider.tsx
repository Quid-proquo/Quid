'use client'

import { createContext, FC, ReactNode, useContext, useEffect, useState } from "react";
import WalletKit from '@/lib/stellar-wallets-kit'
import { ISupportedWallet } from "@creit-tech/stellar-wallets-kit";

type StellarWalletContextType = {
    isConnected: boolean,
    publicKey: string,
    getAvailableWallets: () => Promise<ISupportedWallet[]>,
    connect: (walletId?: string) => Promise<string | undefined>,
    disconnect: () => Promise<boolean>,
}

const StellarWalletContext = createContext<StellarWalletContextType | null>(null);

export const useWalletProvider = () => {
    const context = useContext(StellarWalletContext);

    if (!context) {
        throw new Error("useWalletProvider must be used within a StellarWalletContext");
    }

    return context;
}

export const WalletProvider: FC<{ children: ReactNode }> = ({
    children
}) => {

    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [publicKey, setPublicKey] = useState<string>("");

    useEffect(() => {
        const storedWalletAddress = localStorage.getItem('@StellarWalletsKit/activeAddress');

        if (!storedWalletAddress || storedWalletAddress === "") {
            setIsConnected(false);
            setPublicKey("");
            return;
        }

        setIsConnected(true);
        setPublicKey(storedWalletAddress);
    }, [])
    
    const connect =  async (walletId?: string): Promise<string | undefined> => {
        if (isConnected) {
            const { address } = await WalletKit.getAddress();
            setPublicKey(address);
            return address
        }
        try {

            let address;

            if (walletId) {
                WalletKit.setWallet(walletId);
                const response = await WalletKit.getAddress();
                address = response.address;
            } else {
                const response = await WalletKit.authModal();
                address = response.address;
            }
            localStorage.setItem('@StellarWalletsKit/activeAddress', address);
            setIsConnected(true);
            setPublicKey(address);
            return address
        } catch (err) {
            console.error("Connection Failed: ", err);
            setIsConnected(false);
        }

    }

    const disconnect = async (): Promise<boolean> => {
        if (!isConnected) return true;
        try {
            await WalletKit.disconnect();
            localStorage.removeItem('@StellarWalletsKit/activeAddress') // IF there is more to be stored in local storage later, JSON.stringify can be used for an object
            setIsConnected(false);
            setPublicKey("");
            return true
        } catch(err) {
            console.error(err)
            return false
        }
    }

    const getAvailableWallets = async () => {
        const availableWallets = await WalletKit.refreshSupportedWallets();
        return availableWallets;
    }

    const contextValue: StellarWalletContextType = {
        isConnected: isConnected,
        publicKey,
        connect,
        disconnect,
        getAvailableWallets
    }

    return (
        <StellarWalletContext.Provider value={contextValue}>
            {children}
        </StellarWalletContext.Provider>
    )
}