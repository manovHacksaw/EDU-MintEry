require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks: {
    opencampus: {
      url: "https://rpc.open-campus-codex.gelato.digital",
      accounts: process.env.PRIVATE_KEY !== undefined ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: 656476,
      
      
      gasPrice: 1000000000


    }
  }
};
