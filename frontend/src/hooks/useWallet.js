import { useCallback, useState } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  EXPECTED_CHAIN_ID,
} from "../config.js";

export function useWallet() {
  const [state, setState] = useState({
    connected: false,
    address: null,
    contract: null,
    readContract: null,
    isAdmin: false,
    isNotary: false,
    error: null,
  });

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState((s) => ({
        ...s,
        error: "Install MetaMask: https://metamask.io",
      }));
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      const network = await provider.getNetwork();
      if (network.chainId !== EXPECTED_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x" + EXPECTED_CHAIN_ID.toString(16) }],
          });
        } catch {
          setState((s) => ({
            ...s,
            error: `Wrong network (chainId=${network.chainId}). Switch MetaMask to the expected network.`,
          }));
          return;
        }
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer,
      );
      const readContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider,
      );

      const [adminAddr, isNotary] = await Promise.all([
        readContract.admin(),
        readContract.isNotary(address),
      ]);

      setState({
        connected: true,
        address,
        contract,
        readContract,
        isAdmin: adminAddr.toLowerCase() === address.toLowerCase(),
        isNotary,
        error: null,
      });
    } catch (err) {
      setState((s) => ({ ...s, error: err.shortMessage || err.message }));
    }
  }, []);

  return { ...state, connect };
}
