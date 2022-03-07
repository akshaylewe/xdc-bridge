// @ts-nocheck 
//Importing the Library
import Web3 from "web3";
import DeBridgeGateJson from "../../../Gate.json";
import IERC20Json from "@openzeppelin/contracts/build/contracts/IERC20.json"
import log4js from "log4js";
import {toWei} from "web3-utils";
import {log4jsConfig, Web3RpcUrl} from "./constants";
const UINT_MAX_VALUE = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
import "./parseDotEnvs";
import "./constantMessage";
import { constantMessage } from "./constantMessage";

//Config the logs
log4js.configure(log4jsConfig);

const logger = log4js.getLogger('sendERC20');

//Fetching the Token Address from the .env file
const tokenAddress = process.env.TOKEN_ADDRESS;

//Fetching the Chain Id from the .env file
const chainIdFrom = process.env.CHAIN_ID_FROM;

//Fetching the To Chain Id from the .env file
const chainIdTo = process.env.CHAIN_ID_TO;

//Fetching the Amount from the .env file
const amount = process.env.AMOUNT;

const rpc = Web3RpcUrl[chainIdFrom];
const web3 = new Web3(rpc);

//Fetching the DebridgeAddress from the .env file
const debridgeGateAddress = process.env.DEBRIDGEGATE_ADDRESS;
const debridgeGateInstance = new web3.eth.Contract(DeBridgeGateJson.abi, debridgeGateAddress);
const tokenInstance = new web3.eth.Contract(IERC20Json.abi, tokenAddress);

//Fetching the Private Key from the .env file
const privKey = process.env.PRIVATE_KEY;
const account = web3.eth.accounts.privateKeyToAccount(privKey);
const senderAddress =  account.address;

//printing the Sender Chain Id 
logger.info( constantMessage.ChainFrom ,` : ${chainIdFrom}`); 

//printing the Receiver Chain Id 
logger.info( constantMessage.ChainTo,`: ${chainIdTo}`);

//printing the Amount approved from the sender 
logger.info(constantMessage.Amount , `: ${amount}`);

//printing the Sender URL Network
logger.info(constantMessage.RPC, ` : ${rpc}`);

//printing the Sender Address
logger.info(  constantMessage.SenderAddress,` ${senderAddress}`);

    /**
     * @dev calling the allowance method.
     * @param allowance
     * @return checking the allowance.
     */
const main = async () => {
    const allowance = await getAllowance();
    if (allowance < toWei(amount)){
        logger.info(constantMessage.InsufficientAllowance,` ${allowance} for token ${tokenAddress}, calling approve`);
        await approve(UINT_MAX_VALUE);
    }
    await send(
        toWei("0.01"), // fix fee for transfer
        tokenAddress,//address _tokenAddress,
        toWei(amount), // token _amount
        chainIdTo,// _chainIdTo
        senderAddress, //_receiver
        "0x", // _permit
        false, //_useAssetFee
        0, //_referralCode
        "0x" //_autoParams
    );
}

main().catch(e => logger.error(e));

async function getAllowance() {
    const allowanceString = await tokenInstance.methods.allowance(senderAddress, debridgeGateAddress).call();
    return parseInt(allowanceString);
}

async function approve(newAllowance) {
    logger.info(constantMessage.ApproveToken, ` ${tokenAddress}`, constantMessage.Amount, `: ${newAllowance}`);
    const nonce = await web3.eth.getTransactionCount(senderAddress);
    logger.info(constantMessage.ApproveNonce, nonce);
    const gasPrice = await web3.eth.getGasPrice();
    logger.info(constantMessage.ApproveGas, gasPrice.toString());

    let estimateGas = await tokenInstance.methods
        .approve(debridgeGateAddress, toWei(amount))
        .estimateGas({from: senderAddress})
    ;
    // sometimes not enough estimateGas
    estimateGas = estimateGas*2;
    logger.info(constantMessage.ApproveEstimate, estimateGas.toString());

    const tx = {
            from: senderAddress,
            to: tokenAddress,
            gas: estimateGas,
            value: 0,
            gasPrice,
            nonce,
            data: tokenInstance.methods.approve(debridgeGateAddress, newAllowance).encodeABI(),
        };

    logger.info(constantMessage.ApproveTx, tx);
    const signedTx = await web3.eth.accounts.signTransaction(tx, privKey);
    logger.info(constantMessage.ApproveSing, signedTx);

    let result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    logger.info(constantMessage.ApproveResult, result);
}

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
    fixNativeFee, // fix fee for transfer
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
    logger.info(constantMessage.SendNonce, nonce);
    const gasPrice = await web3.eth.getGasPrice();
    logger.info(constantMessage.SendGas, gasPrice.toString());
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
     * @param fixNativeFee the param 
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
            value: fixNativeFee
        });

    logger.info("Send estimateGas", estimateGas.toString());

    //Getting the hash value
    const tx =
    {
        from: senderAddress,
        to: debridgeGateAddress,
        gas: estimateGas,
        value: fixNativeFee,
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

    logger.info(constantMessage.SendTx, tx);
    const signedTx = await web3.eth.accounts.signTransaction(tx, privKey);
    logger.info(constantMessage.SendSign, signedTx);

    let result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    logger.info(constantMessage.SendRes, result);

    const logs = result.logs.find(l=>l.address===debridgeGateAddress);
    const submissionId = logs.data.substring(0, 66);
    logger.info( constantMessage.Submission,` ${submissionId}`);
    logger.info(constantMessage.Success);
}