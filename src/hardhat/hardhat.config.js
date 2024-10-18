require("@nomicfoundation/hardhat-toolbox");

const endpointUrl = "localhost";
//const privateKey = "<optional_private_key>"; // This is an optional key that can be added to allow a non-default hardhat account. Be sure to comment out the below if adding one.

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks: {
    sepolia: {
      url: endpointUrl,
//      accounts: [privateKey],
    },
  },
};
