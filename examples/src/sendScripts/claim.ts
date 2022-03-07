// @ts-nocheck
//Importing Library
import Web3 from "web3";
import DeBridgeGateJson from "../../../Gate.json";
import DeployerJson from "../../../Deployer.json";
import log4js from "log4js";
import {log4jsConfig, Web3RpcUrl} from "./constants";
import "./parseDotEnvs";
import { constantMessage } from "./constantMessage";

//Config Library
log4js.configure(log4jsConfig);

const logger = log4js.getLogger('claim');

//Importing the private key from .env file
const privKey = process.env.PRIVATE_KEY;
const account = new Web3().eth.accounts.privateKeyToAccount(privKey);
const senderAddress =  account.address;
logger.info(constantMessage.SenderAddress,` : ${senderAddress}`);

//Importing the Api end point from .env file
const {API_ENDPOINT} = process.env;

//Fetch the Debridgegate Address from the deployement folder, debridge file
const DEBRIDGEGATE_ADDRESS = '0x3Ebb7150C553113509f1d488c481F800a2983688'

//Importing the Submission ID from .env file
const SUBMISSION_ID = process.env.SUBMISSION_ID;
logger.info(constantMessage.Submission,` : ${SUBMISSION_ID}`);


(async () => {
    try {
        //Chain Id of the network
        const chainIdTo = 3;

        //URL of the network
        const rpc = Web3RpcUrl[chainIdTo];
        const web3 = new Web3(rpc);

        //Address of the DebridgeGate Token
        const debridgeGateInstance = new web3.eth.Contract(DeBridgeGateJson.abi, DEBRIDGEGATE_ADDRESS);

        //Verifying the Submission ID
        const isSubmissionUsed = await debridgeGateInstance.methods.isSubmissionUsed(SUBMISSION_ID).call();

        //Sending the tokens to the to address with containing chain Id and Address
        const debridge_id = await debridgeGateInstance.methods.getDebridgeId(51, '0xeAe46f035CfAA057D31F9a3777285beC69d9679C').call();
        const _token = '0xfd5dF7C64C164411438Ea0448240c0137495d1D8'
        const debridge_ids = await debridgeGateInstance.methods.deployNewAsset('0xeAe46f035CfAA057D31F9a3777285beC69d9679C', 51, 'MappedXDC', 'MXDC', 18, '0x').call();
        logger.info(constantMessage.Debridge,`: ${debridge_id}`);
        logger.info(constantMessage.Token,`: ${_token}`);

        
        if (isSubmissionUsed) {
            logger.error(constantMessage.SubmissionAlready);
            return;
        }

        //prefix stating from 0x
        let mergedSignatures = '0x';
        
        //prefix stating from 0x
        const autoParamsFrom = await _packSubmissionAutoParamsFrom(web3, '0x');

    /**
     * @dev performing the claim method.
     * @param calling the param 
     * @param web3 library of the block chain
     * @param debridgeId Id of the Debridge
     * @param amount amount should be transfered to the to address
     * @param chainIdFrom From which network should transaction happen
     * @param receiver Reciver Address
     * @param subNonce Private Key of the From Address
     * @param signatures Signature of the Token
     * @return an hash value of the claim function.
     */
        await claim(
            web3,
            debridgeGateInstance,
            debridge_id,
            '5',
            '51',
            '0x852e7627aEFF3ed6105F600D985cC6f74DBd6640',
            SUBMISSION_ID,
            mergedSignatures,
            autoParamsFrom,
            _token
        );
    } catch (e) {
        logger.error(e);
    }
})();

    /**
     * @dev performing the claim method.
     * @param calling the param 
     * @param web3 library of the block chain
     * @param debridgeId Id of the Debridge
     * @param amount amount should be transfered to the to address
     * @param chainIdFrom From which network should transaction happen
     * @param receiver Reciver Address
     * @param subNonce Private Key of the From Address
     * @param signatures Signature of the Token
     * @return an hash value of the claim function.
     */
async function claim(
    web3,
    debridgeGateInstance,
    debridgeId,  //bytes32 _debridgeId,
    amount,      // uint256 _amount,
    chainIdFrom, //uint256 _chainIdFrom,
    receiver,    // address _receiver,
    subNonce,    // uint256 _nonce
    signatures,  //bytes calldata _signatures,
    autoParams,  //bytes calldata _autoParams,
    _token,
) {
    logger.info(constantMessage.TestCl);
    let nonce = await web3.eth.getTransactionCount(senderAddress);
    logger.info(constantMessage.NonceCurr, nonce);
    const gasPrice = await web3.eth.getGasPrice();
    logger.info(constantMessage.GasPri, gasPrice.toString());
    logger.info({
        debridgeId, //bytes32 _debridgeId,
        amount, // uint256 _amount,
        chainIdFrom, //uint256 _chainIdFrom,
        receiver, // address _receiver,
        nonce, // uint256 _nonce
        signatures, //bytes calldata _signatures,
        autoParams, //bytes calldata _autoParams,
        _token,
    });

    //Getting the hash value
    const tx =
    {
        from: senderAddress,
        to: DEBRIDGEGATE_ADDRESS,
        gas: 300000,
        value: 0,
        gasPrice: gasPrice,
        nonce,
        data: debridgeGateInstance.methods
            .claim(
                debridgeId, //bytes32 _debridgeId,
                amount, // uint256 _amount,
                chainIdFrom, //uint256 _chainIdFrom,
                receiver, // address _receiver,
                subNonce, // uint256 _nonce
                signatures, //bytes calldata _signatures,
                autoParams, //bytes calldata _autoParams,
                _token,
            )
            .encodeABI(),
    };

    logger.info(constantMessage.Tx, tx);
    const signedTx = await web3.eth.accounts.signTransaction(tx, privKey);
    logger.info(constantMessage.Sign, signedTx);

    const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    logger.info(constantMessage.Res, result);
    logger.info(constantMessage.Success);
}

    /**
     * @dev performing the claim method.
     * @param submissionId and minconfirmation   .
     * @return an Minimum confirmation block  .
     */
async function _checkConfirmation(submissionId, minConfirmations) {
    const confirmations = await getSubmissionConfirmations(submissionId, API_ENDPOINT);
    return {
        isConfirmed: (confirmations.length >= minConfirmations),
        confirmations,
    }
}

    /**
     * @dev fetching the result.
     * @param autoParams and web3   .
     * @return the result of the transaction and hash value .
     */
async function _packSubmissionAutoParamsFrom(web3, autoParams) {
    if (autoParams !== '0x' && autoParams !== '') {
        const decoded = web3.eth.abi.decodeParameters(
            ['tuple(uint256,uint256, bytes, bytes)'], autoParams
        );
        logger.info(`autoParams: ${autoParams}, decoded: ${decoded}`);
        const encoded = web3.eth.abi.encodeParameter(
            'tuple(uint256,uint256, address, bytes, bytes)',
            [decoded[0][0], decoded[0][1], decoded[0][2], decoded[0][3]]
        );
        logger.info(`encoded: ${encoded}`);
        return encoded;
    }
    return '0x';
}
