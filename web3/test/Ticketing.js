const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Ticketing Contract', () => {
    let Ticketing, ticketing;
    let deployer, buyer1, buyer2;

    const eventName = "Test Event";
    const eventCost = ethers.parseUnits('2', 'ether');
    const eventMaxTickets = 500;
    const eventDate = "Dec 14";
    const eventTime = "7:00PM IST";
    const eventLocation = "Aquatica, Kolkata";

    beforeEach(async () => {
        [deployer, buyer1, buyer2] = await ethers.getSigners();

        Ticketing = await ethers.getContractFactory("Ticketing");
        ticketing = await Ticketing.deploy("Ticketing", "TM");

        await ticketing.connect(deployer).list(
            eventName,
            eventCost,
            eventMaxTickets,
            eventDate,
            eventTime,
            eventLocation
        );
    });

    describe('Deployment', () => {
        it("Should set the name and symbol correctly", async () => {
            expect(await ticketing.name()).to.equal("Ticketing");
            expect(await ticketing.symbol()).to.equal("TM");
        });

        it("Should set the deployer as the owner", async () => {
            expect(await ticketing.owner()).to.equal(deployer.address);
        });

        it("Should initialize occasion count to 1 after listing", async () => {
            expect(await ticketing.occasionCount()).to.equal(1);
        });

        it("Should emit an OccasionListed event when a new occasion is listed", async () => {
            await expect(ticketing.connect(deployer).list(
                "New Event",
                ethers.parseUnits('1', 'ether'),
                300,
                "Jan 1",
                "6:00PM",
                "Park Street"
            ))
            .to.emit(ticketing, "OccasionListed")
            .withArgs(2, "New Event", ethers.parseUnits('1', 'ether'), 300, "Jan 1", "6:00PM", "Park Street");
        });
    });

    describe('Minting Tickets', () => {
        const occasionId = 1;
        const seatNo = 10;

        it("Should allow a user to mint a ticket", async () => {
            await expect(ticketing.connect(buyer1).mint(occasionId, seatNo, { value: eventCost }))
                .to.emit(ticketing, "TicketMinted")
                .withArgs(occasionId, buyer1.address, seatNo, 1);

            const occasion = await ticketing.getOccasion(occasionId);
            expect(occasion.maxTickets).to.equal(eventMaxTickets - 1);
            expect(occasion.ticketsSold).to.equal(1);
        });

        it("Should assign the seat to the buyer", async () => {
            await ticketing.connect(buyer1).mint(occasionId, seatNo, { value: eventCost });
            const seatOwner = await ticketing.seatTaken(occasionId, seatNo);
            expect(seatOwner).to.equal(buyer1.address);
        });

        it("Should prevent buying a ticket for an already taken seat", async () => {
            await ticketing.connect(buyer1).mint(occasionId, seatNo, { value: eventCost });

            await expect(ticketing.connect(buyer2).mint(occasionId, seatNo, { value: eventCost }))
                .to.be.revertedWith("Seat already taken");
        });

        it("Should reject minting a ticket with insufficient payment", async () => {
            await expect(ticketing.connect(buyer1).mint(occasionId, seatNo, { value: ethers.parseUnits('1', 'ether') }))
                .to.be.revertedWith("Insufficient payment");
        });

        it("Should prevent a user from buying more than one ticket per event", async () => {
            await ticketing.connect(buyer1).mint(occasionId, seatNo, { value: eventCost });

            await expect(ticketing.connect(buyer1).mint(occasionId, 20, { value: eventCost }))
                .to.be.revertedWith("Already bought a ticket");
        });

        it("Should refund excess payment", async () => {
            const initialBalance = await buyer1.balance;

            const tx = await ticketing.connect(buyer1).mint(occasionId, seatNo, { value: ethers.parseUnits('3', 'ether') });
            const receipt = await tx.wait();
            const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);

            const finalBalance = await buyer1.getBalance();
            const refundedAmount = ethers.parseUnits('1', 'ether');

            expect(initialBalance.sub(finalBalance)).to.be.closeTo(eventCost.add(gasCost), refundedAmount);
        });

        it("Should update totalSupply after minting", async () => {
            await ticketing.connect(buyer1).mint(occasionId, seatNo, { value: eventCost });
            expect(await ticketing.totalSupply()).to.equal(1);
        });

        it("Should reject minting for invalid occasion ID", async () => {
            await expect(ticketing.connect(buyer1).mint(99, seatNo, { value: eventCost }))
                .to.be.revertedWith("Invalid occasion ID");
        });
    });

    describe('Edge Cases', () => {
        it("Should reject minting a ticket when all tickets are sold out", async () => {
            for (let i = 1; i <= eventMaxTickets; i++) {
                await ticketing.connect(deployer).mint(1, i, { value: eventCost });
            }

            await expect(ticketing.connect(buyer1).mint(1, eventMaxTickets + 1, { value: eventCost }))
                .to.be.revertedWith("No tickets available");
        });

        it("Should allow the owner to list multiple occasions", async () => {
            await ticketing.connect(deployer).list(
                "Another Event",
                ethers.parseUnits('1.5', 'ether'),
                100,
                "Jan 15",
                "8:00PM",
                "Eco Park"
            );

            expect(await ticketing.occasionCount()).to.equal(2);
        });

        it("Should reject listing an occasion with invalid parameters", async () => {
            await expect(ticketing.connect(deployer).list(
                "Invalid Event",
                0,
                100,
                "Jan 1",
                "6:00PM",
                "Invalid Location"
            )).to.be.revertedWith("Cost must be greater than 0");

            await expect(ticketing.connect(deployer).list(
                "Invalid Event",
                ethers.parseUnits('1', 'ether'),
                0,
                "Jan 1",
                "6:00PM",
                "Invalid Location"
            )).to.be.revertedWith("Max tickets must be greater than 0");
        });

        it("Should only allow the owner to list occasions", async () => {
            await expect(ticketing.connect(buyer1).list(
                "Unauthorized Event",
                ethers.parseUnits('1', 'ether'),
                100,
                "Jan 15",
                "6:00PM",
                "Some Location"
            )).to.be.revertedWith("Only owner can call this function");
        });
    });
});
