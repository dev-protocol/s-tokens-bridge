/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'

module.exports = {
        solidity: "0.8.4",
        networks: {
                hardhat: {
                        gas: 12000000,
                        blockGasLimit: 0x1fffffffffffff,
                        allowUnlimitedContractSize: true,
                        timeout: 1800000
                }
        }
};
