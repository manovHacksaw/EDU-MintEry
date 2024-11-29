'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/context/web3-provider';
import TicketingABI from '@/lib/contract-abi.js';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x3Fd119d3d6C5693F742cBe102868B684b4A3C810';

export const useTicketContract = () => {
  const { provider, signer } = useWeb3();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getContract = useCallback(() => {
    if (signer) {
      const ticketContract = new ethers.Contract(
        CONTRACT_ADDRESS, 
        TicketingABI.abi, 
        signer
      );
      setContract(ticketContract);
      console.log(ticketContract)
      return ticketContract;
    }
    return null;
  }, [signer]);

  

  const listOccasion = async (
    name, 
    cost, 
    maxTickets, 
    date, 
    time, 
    location
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const contractInstance = getContract();
      if (!contractInstance) {
        throw new Error('Contract not initialized');
      }

      const tx = await contractInstance.list(
        name, 
        ethers.utils.parseEther(cost.toString()), 
        maxTickets, 
        date, 
        time, 
        location
      );
      
      await tx.wait();
      setLoading(false);
      return tx;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
      throw err;
    }
  };

  const mintTicket = async (occasionId, seatNo, cost) => {
    try {
      setLoading(true);
      setError(null);
      
      const contractInstance = getContract();
      if (!contractInstance) {
        throw new Error('Contract not initialized');
      }

      const tx = await contractInstance.mint(occasionId, seatNo, {
        value: ethers.utils.parseEther(cost.toString())
      });
      
      await tx.wait();
      setLoading(false);
      return tx;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
      throw err;
    }
  };

  const getOccasion = async (occasionId) => {
    try {
      setLoading(true);
      setError(null);
      
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, TicketingABI.abi, provider);
      if (!contractInstance) {
        throw new Error('Contract not initialized');
      }

      const occasion = await contractInstance.getOccasion(1);
      console.log(occasion)
      setLoading(false);
      return occasion;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
      console.log(err)
      throw err;
    }
  };

  return {
    contract,
    loading,
    error,
    listOccasion,
    mintTicket,
    getOccasion
  };
};
