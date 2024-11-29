const { ethers } = require("hardhat");

async function main() {
  // Deploy the contract
  console.log("Deploying Ticketing contract...");
  const Ticketing = await ethers.getContractFactory("Ticketing");
  const ticketing = await Ticketing.deploy("IndiaEvents", "IEVT");

  console.log("Waiting for contract deployment...");
  await ticketing.waitForDeployment();

  console.log("Ticketing contract deployed to:", await ticketing.getAddress());
//   0x3Fd119d3d6C5693F742cBe102868B684b4A3C810

  // Create events for India
  const events = [
    {
      name: "Bollywood Night",
      cost: ethers.parseEther("0.1"), // 0.1 ETH
      maxTickets: 100,
      date: "2024-12-01",
      time: "18:00",
      location: "Mumbai, Maharashtra",
    },
    {
      name: "Startup Meetup",
      cost: ethers.parseEther("0.05"), // 0.05 ETH
      maxTickets: 50,
      date: "2024-12-10",
      time: "10:00",
      location: "Bangalore, Karnataka",
    },
    {
      name: "Cultural Fest",
      cost: ethers.parseEther("0.08"), // 0.08 ETH
      maxTickets: 200,
      date: "2025-01-15",
      time: "14:00",
      location: "Delhi, India",
    },
  ];

  console.log("Listing events...");
  for (const event of events) {
    console.log(`Listing event: ${event.name}`);
    console.log(`Details: Date - ${event.date}, Time - ${event.time}, Location - ${event.location}`);
    
    const tx = await ticketing.list(
      event.name,
      event.cost,
      event.maxTickets,
      event.date,
      event.time,
      event.location
    );

    console.log(`Waiting for transaction to be mined for ${event.name}...`);
    await tx.wait();

    console.log(`Event listed: ${event.name}`);
    console.log(`Transaction hash: ${tx.hash}`);
  }

  console.log("All events have been listed successfully!");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
