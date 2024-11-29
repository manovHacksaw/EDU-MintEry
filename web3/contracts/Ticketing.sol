// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// A simple ERC721 contract for minting NFTs
contract Ticketing is ERC721 {
    address public owner;
    uint256 public occasionCount = 0;
    uint256 public totalSupply = 0;

    struct Occasion {
        uint256 id;
        string name;
        uint256 cost;
        uint256 maxTickets;
        string date;
        string time;
        string location;
        uint256 ticketsSold;
    }

    mapping(uint256 => Occasion) public occasions;
    mapping(uint256 => mapping(uint256 => address)) public seatTaken; // Tracks seat assignments
    mapping(uint256 => mapping(address => bool)) public hasBought; // Tracks user purchases
    mapping(uint256 => uint256[]) public seatsTaken; // Tracks all seats taken for an occasion

    event OccasionListed(
        uint256 indexed id,
        string name,
        uint256 cost,
        uint256 maxTickets,
        string date,
        string time,
        string location
    );

    event TicketMinted(
        uint256 indexed occasionId,
        address indexed buyer,
        uint256 seatNo,
        uint256 tokenId
    );

    event Withdrawal(address indexed owner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        owner = msg.sender;
    }

    /**
     * @dev Lists a new occasion for ticketing.
     */
    function list(
        string memory _name,
        uint256 _cost,
        uint256 _maxTickets,
        string memory _date,
        string memory _time,
        string memory _location
    ) public onlyOwner {
        require(_cost > 0, "Cost must be greater than 0");
        require(_maxTickets > 0, "Max tickets must be greater than 0");

        occasionCount++;
        occasions[occasionCount] = Occasion(
            occasionCount,
            _name,
            _cost,
            _maxTickets,
            _date,
            _time,
            _location,
            0
        );

        emit OccasionListed(
            occasionCount,
            _name,
            _cost,
            _maxTickets,
            _date,
            _time,
            _location
        );
    }

    /**
     * @dev Mints a ticket for a specific occasion and seat.
     */
    function mint(uint256 _id, uint256 _seatNo) public payable {
        Occasion storage occasion = occasions[_id];

        require(_id > 0 && _id <= occasionCount, "Invalid occasion ID");
        require(msg.value >= occasion.cost, "Insufficient payment");
        require(occasion.maxTickets > 0, "No tickets available");
        require(seatTaken[_id][_seatNo] == address(0), "Seat already taken");
        require(!hasBought[_id][msg.sender], "Already bought a ticket");

        // Deduct one ticket from the max tickets
        occasion.maxTickets--;
        occasion.ticketsSold++;

        // Assign the seat to the buyer
        seatTaken[_id][_seatNo] = msg.sender;
        seatsTaken[_id].push(_seatNo);
        hasBought[_id][msg.sender] = true;

        totalSupply++;

        // Refund excess payment if any
        if (msg.value > occasion.cost) {
            payable(msg.sender).transfer(msg.value - occasion.cost);
        }

        // Mint the NFT
        _safeMint(msg.sender, totalSupply);

        emit TicketMinted(_id, msg.sender, _seatNo, totalSupply);
    }

    /**
     * @dev Fetches details of a specific occasion.
     */
    function getOccasion(uint256 _id) public view returns (Occasion memory) {
        require(_id > 0 && _id <= occasionCount, "Invalid occasion ID");
        return occasions[_id];
    }

    /**
     * @dev Allows the owner to withdraw all Ether from the contract.
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds available for withdrawal");

        payable(owner).transfer(balance);
        emit Withdrawal(owner, balance);
    }

    /**
     * @dev Fallback function to receive Ether.
     */
    receive() external payable {}

    fallback() external payable {}
}
