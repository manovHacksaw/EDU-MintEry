'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext({
  provider: null,
  signer: null,
  address: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Create provider and signer
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const web3Signer = await web3Provider.getSigner();

        // Get user address
        const userAddress = await web3Signer.getAddress();
        console.log(userAddress)

        setProvider(web3Provider);
        setSigner(web3Signer);
        setAddress(userAddress);
      } catch (error) {
        console.error('Failed to connect wallet', error);
      }
    } else {
      alert('Please install MetaMask');
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
  };

  // Listen for account changes
  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        connectWallet();
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  return (
    <Web3Context.Provider value={{ 
      provider, 
      signer, 
      address, 
      connectWallet, 
      disconnectWallet 
    }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
