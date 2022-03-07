// @ts-nocheck 
//Importing the Library
import {config} from "dotenv-flow";
import DeBridgeGateJson from "../../../Gate.json";
import log4js from "log4js";
import web3Utils from "web3-utils";
import Web3 from "web3";
import {log4jsConfig, Web3RpcUrl} from "./constants";
const {toWei} = web3Utils;
import "./parseDotEnvs";
import "./constantMessage";

config();

//Config the logs
log4js.configure(log4jsConfig);

const logger = log4js.getLogger('sendETH');

//Fetching the Sender ChainId from the .env file
const chainIdFrom = process.env.CHAIN_ID_FROM;

//Fetching the Reciever Chain Id from the .env file
const chainIdTo = process.env.CHAIN_ID_TO;

//Fetching the Amount from the .env file
const amount = process.env.AMOUNT;

//Fetching the Network URL from the .env file
const rpc = Web3RpcUrl[chainIdFrom];
const web3 = new Web3(rpc);

//Fetching the DebridgeGate Address from the .env file
const debridgeGateAddress = process.env.DEBRIDGEGATE_ADDRESS;
const debridgeGateInstance = new web3.eth.Contract(DeBridgeGateJson.abi, debridgeGateAddress);

//Fetching the Private Key from the .env file
const privKey = process.env.PRIVATE_KEY;
const account = web3.eth.accounts.privateKeyToAccount(privKey);
const senderAddress = account.address;

//printing the Sender Chain Id 
logger.info(constantMessage.ChainFrom ,`: ${chainIdFrom}`);

//printing the Receiver Chain Id 
logger.info( constantMessage.ChainTo,`: ${chainIdTo}`);

//printing the Amount
logger.info(constantMessage.Amount , `: ${amount}`);

//printing the Network URL
logger.info(constantMessage.RPC, ` : ${rpc}`);

//printing the Sender Address
logger.info(  constantMessage.SenderAddress,` ${senderAddress}`);

send(
    toWei(amount), // native amount for transfer
    "0x0000000000000000000000000000000000000000",//address _tokenAddress,
    toWei(amount), // token _amount
    chainIdTo,// _chainIdTo
    senderAddress, //_receiver
    "0x", // _permit
    false, //_useAssetFee
    0, //_referralCode
    "0x" //_autoParams
).catch(e => logger.error(e))

    /**
     * @dev performing the send method.
     * @param fixNativeFee the param 
     * @param tokenAddress Token Address
     * @param amount amount should be transfered to the to address
     * @param chainIdTo Reciver Chain Id
     * @param receiver Reciver Address
     * @param permit Permission from the Sender Address
     * @param autoParams Auto Params 
     * @return an hash value of the send function.
     */
async function send(
    nativeAmount, // native amount for transfer
    tokenAddress, //address _tokenAddress,
    amount, // uint256 _amount,
    chainIdTo, //uint256 _chainIdTo,
    receiver, // bytes memory _receiver,
    permit, //bytes memory _permit,
    useAssetFee, //bool _useAssetFee,
    referralCode, //uint32 _referralCode,
    autoParams// bytes calldata _autoParams
) {
    logger.info(constantMessage.Test);
    const nonce = await web3.eth.getTransactionCount(senderAddress);
    logger.info(constantMessage.NonceCurr, nonce);
    const gasPrice = await web3.eth.getGasPrice();
    logger.info(constantMessage.GasPri, gasPrice.toString());
    logger.info({
        tokenAddress, //address _tokenAddress,
        amount, // uint256 _amount,
        chainIdTo, //uint256 _chainIdTo,
        receiver, // bytes memory _receiver,
        permit, //bytes memory _permit,
        useAssetFee, //bool _useAssetFee,
        referralCode, //uint32 _referralCode,
        autoParams// bytes calldata _autoParams
    });

    /**
     * @dev performing the send method.
     * @param tokenAddress Token Address
     * @param amount amount should be transfered to the to address
     * @param chainIdTo Reciver Chain Id
     * @param receiver Reciver Address
     * @param permit Permission from the Sender Address
     * @param autoParams Auto Params 
     * @return an hash value of the send function.
     */
    const estimateGas = await debridgeGateInstance.methods
        .send(
            tokenAddress, //address _tokenAddress,
            amount, // uint256 _amount,
            chainIdTo, //uint256 _chainIdTo,
            receiver, // bytes memory _receiver,
            permit, //bytes memory _permit,
            useAssetFee, //bool _useAssetFee,
            referralCode, //uint32 _referralCode,
            autoParams// bytes calldata _autoParams
        )
        .estimateGas({
            from: senderAddress,
            value: nativeAmount
        });

    logger.info(constantMessage.Estimate, estimateGas.toString());

    //Getting the hash value
    const tx =
        {
            from: senderAddress,
            to: debridgeGateAddress,
            gas: 300000,
            value: nativeAmount,
            gasPrice: gasPrice,
            nonce,
            data: debridgeGateInstance.methods
                .send(
                    tokenAddress, //address _tokenAddress,
                    amount, // uint256 _amount,
                    chainIdTo, //uint256 _chainIdTo,
                    receiver, // bytes memory _receiver,
                    permit, //bytes memory _permit,
                    useAssetFee, //bool _useAssetFee,
                    referralCode, //uint32 _referralCode,
                    autoParams// bytes calldata _autoParams
                )
                .encodeABI(),
        };

    logger.info(constantMessage.Tx, tx);
    const signedTx = await web3.eth.accounts.signTransaction(tx, privKey);
    logger.info(constantMessage.Sign, signedTx);

    const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    logger.info(constantMessage.Res, result);
    const logs = result.logs.find(l => l.address === debridgeGateAddress);
    const submissionId = logs.data.substring(0, 66);
    logger.info($constantMessage.Submission ,` ${submissionId}`);
    logger.info(constantMessage.Success);
}