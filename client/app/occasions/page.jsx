'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTicketContract } from '@/hooks/useTicketContract';
import { useWeb3 } from '@/context/web3-provider';
import { useToast } from '@/components/ui/use-toast';
import { ethers } from 'ethers';

export default function OccasionsPage() {
  const { address, connectWallet } = useWeb3();
  const { getOccasion, mintTicket, loading, error } = useTicketContract();
  const { toast } = useToast();
  const [occasions, setOccasions] = useState([]);
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);

  useEffect(() => {
    const fetchOccasions = async () => {
      try {
        // Assuming you want to fetch a fixed number of occasions, like 1, 2, 3, etc.
        const occasionIds = [1, 2, 3]; // Example
        const fetchedOccasions = await Promise.all(
          occasionIds.map(id => getOccasion(id)) // Fetch each occasion by ID
        );
        setOccasions(fetchedOccasions);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch occasions",
          variant: "destructive"
        });
      }
    };

    if (address) {
      fetchOccasions();
    }
  }, [address]);

  const handleMintTicket = async () => {
    if (!selectedOccasion || selectedSeat === null) {
      toast({
        title: "Error",
        description: "Please select an occasion and seat",
        variant: "destructive"
      });
      return;
    }

    try {
      const tx = await mintTicket(
        selectedOccasion.id, 
        selectedSeat, 
        selectedOccasion.cost
      );
      
      toast({
        title: "Success",
        description: "Ticket minted successfully!"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: error || "Failed to mint ticket",
        variant: "destructive"
      });
    }
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <h1 className="text-2xl mb-4">Connect Your Wallet to View Occasions</h1>
        <Button onClick={connectWallet}>Connect Wallet</Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {occasions.map((occasion) => (
        <motion.div 
          key={occasion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{occasion.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Date: {occasion.date}</p>
              <p>Time: {occasion.time}</p>
              <p>Location: {occasion.location}</p>
              <p>Cost: {ethers.utils.formatEther(occasion.cost)} ETH</p>
              <p>Tickets Left: {occasion.maxTickets}</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="mt-4 w-full"
                    onClick={() => setSelectedOccasion(occasion)}
                  >
                    Buy Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Seat for {occasion.name}</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-5 gap-2">
                    {[...Array(occasion.maxTickets)].map((_, index) => (
                      <Button
                        key={index}
                        variant={selectedSeat === index + 1 ? 'default' : 'outline'}
                        onClick={() => setSelectedSeat(index + 1)}
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                  <Button 
                    onClick={handleMintTicket}
                    disabled={loading || !selectedSeat}
                    className="w-full mt-4"
                  >
                    {loading ? 'Minting...' : 'Confirm Seat'}
                  </Button>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
