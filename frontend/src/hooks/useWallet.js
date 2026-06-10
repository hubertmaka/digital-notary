import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  EXPECTED_CHAIN_ID,
} from "../config.js";

const INITIAL_STATE = {
  connected: false,
  address: null,
  contract: null,
  readContract: null,
  isAdmin: false,
  isNotary: false,
  error: null,
};

export function useWallet() {
  const [state, setState] = useState(INITIAL_STATE);

  const hydrateWalletState = useCallback(async (provider, signerAddress) => {
    const signer = await provider.getSigner(signerAddress);
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

    return {
      connected: true,
      address,
      contract,
      readContract,
      isAdmin: adminAddr.toLowerCase() === address.toLowerCase(),
      isNotary,
      error: null,
    };
  }, []);

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
      const accounts = await provider.send("eth_requestAccounts", []);

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

      const nextState = await hydrateWalletState(provider, accounts?.[0]);
      setState(nextState);
    } catch (err) {
      setState((s) => ({ ...s, error: err.shortMessage || err.message }));
    }
  }, [hydrateWalletState]);

  const syncFromAuthorizedAccounts = useCallback(async () => {
    if (!window.ethereum) {
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);

      if (!accounts || accounts.length === 0) {
        setState({ ...INITIAL_STATE });
        return;
      }

      const network = await provider.getNetwork();
      if (network.chainId !== EXPECTED_CHAIN_ID) {
        setState((s) => ({
          ...INITIAL_STATE,
          error:
            s.connected || s.error
              ? `Wrong network (chainId=${network.chainId}). Switch MetaMask to the expected network.`
              : null,
        }));
        return;
      }

      const nextState = await hydrateWalletState(provider, accounts[0]);
      setState(nextState);
    } catch (err) {
      setState((s) => ({ ...s, error: err.shortMessage || err.message }));
    }
  }, [hydrateWalletState]);

  const disconnect = useCallback(async () => {
    if (window.ethereum?.request) {
      try {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch {
        // Some wallets do not support revokePermissions; local disconnect still works.
      }
    }

    setState({ ...INITIAL_STATE });
  }, []);

  useEffect(() => {
    syncFromAuthorizedAccounts();

    if (!window.ethereum?.on) {
      return;
    }

    const handleAccountsChanged = () => {
      syncFromAuthorizedAccounts();
    };
    const handleChainChanged = () => {
      syncFromAuthorizedAccounts();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (!window.ethereum?.removeListener) {
        return;
      }
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [syncFromAuthorizedAccounts]);

  return { ...state, connect, disconnect };
}
