// importing dependences 
import { config as dotenvConfig } from 'dotenv-flow';
import { task } from "hardhat/config"
import '@nomiclabs/hardhat-truffle5';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-waffle';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-contract-sizer';
import 'hardhat-gas-reporter';
import '@nomiclabs/hardhat-solhint';
import 'prettier-plugin-solidity';
import 'solidity-coverage';
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'

//Config the .env file
dotenvConfig();

//Exporting the defalt function
export default {
  gasReporter: {
    currency: "USD",
    gasPrice: 100,
  },

//Paths of the file
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./scripts/deploy"
  },
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */
  //

  //solidity complier version and settings
  solidity: {
    compilers: [
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.6.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  external: {
    contracts: [
      {
        artifacts: "./precompiled",
      },
    ],
  },
  namedAccounts: {
    deployer: 0
  },
  networks: {
    hardhat: {
      accounts:{mnemonic:process.env.MNEMONIC},
      chainId: 1
    },

  //test url for connecting to ganache
    test: {
      url: "http://127.0.0.1:8545/",
      accounts: {mnemonic:process.env.MNEMONIC},
    },

  //kovan testnet URL with chain id
    kovan: {
      url: "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      gasPrice: 3e9,
      gas: 6.9e6,
      chainId: 3
    },
    
    //bsc testnet URL with chain id
    bsctest: {
      url: "https://data-seed-prebsc-1-s2.binance.org:8545/",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 97
    },

    //HecoInfo testnet URL with chain id
    hecotest: {
      url: "https://http-testnet.hecochain.com/",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      // gasPrice: 1e9,
      chainId: 256
    },

    //Arbitrum testnet URL with chain id
    arethtest: {
      url: "https://rinkeby.arbitrum.io/rpc",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      // gasPrice: 1e9,
      // gas: 1e6,
      chainId: 421611
    },

    //Polygon testnet URL with chain id
    mumbai: {
      url:"https://apis.ankr.com/28e515e83aba427a8334cf38d63d0ae6/363542f636c41556afec7d1feb0f0a88/polygon/full/test",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      // gasPrice: 1e10, //10 Gwei
      chainId: 80001
    },

    //RinkeyBy testnet URL with chain id
    RINKEBY: {
      url: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      gasPrice: 2e9,
      //gas: 6.9e6,
      chainId: 4
    },

    //Ethernet Mainnet URL with chain id
    ETH: {
      url: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      gasPrice: 95e9,
      // gas: 6.9e6,
      chainId: 1
    },

    //Binance Smart Chain Mainnet URL with chain id
    BSC: {
      url: "https://bsc-dataseed.binance.org/",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      gasPrice: 5e9,
      chainId: 56
    },

    //Huobi Eco Chain  Mainnet URL with chain id
    HECO: {
      url: "https://http-mainnet.hecochain.com",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 128
    },

    //Polymath Chain  Mainnet URL with chain id
    MATIC: {
      url: "https://polygon-rpc.com/",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 137
    },

    //ARBITRUM Chain  Mainnet URL with chain id
    ARBITRUM: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 42161
    },
  },

  mocha: {
    timeout: 100000
  },
  etherscan: {
    apiKey: ""
  },
}

task("upgrade", "Upgrade smart contract")
  .addPositionalParam("contract", "Name of a smart contract")
  .addPositionalParam("address", "Contract's proxy address")
  .addOptionalParam("signer", "Named signer for upgrade transaction", "deployer")
  .setAction(async (args, hre) => {
    const { upgradeProxy } = require("./scripts/deploy-utils");

    const accounts = await hre.getNamedAccounts();
    const signer = accounts[args.signer];

    if (!signer) {
      throw new Error("Unknown signer!");
    }

    if (!hre.ethers.utils.isAddress(args.address)) {
      throw Error(`Invalid contract address ${args.address}`)
    }

    const { contract, receipt } = await upgradeProxy(args.contract, args.address, signer);
  })
